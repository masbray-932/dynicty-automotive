import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { isSessionExpired } from "@/features/auth/session";
import { getServerEnv } from "@/server/env";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { allowsPermission, type AuthorizationRequest, type DealerAdministrator } from "./authorization";

const COOKIE_NAME = "dynicty_admin_session";
const SESSION_LENGTH_MS = 1000 * 60 * 60 * 24 * 7;
const EXPIRED_SESSION_CLEANUP_LIMIT = 100;

function tokenHash(token: string) {
  return createHmac("sha256", getServerEnv().SESSION_SECRET)
    .update(token)
    .digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LENGTH_MS);

  await db.$transaction([
    db.adminSession.deleteMany({
      where: { expiresAt: { lte: new Date() } },
      limit: EXPIRED_SESSION_CLEANUP_LIMIT,
    }),
    db.adminSession.create({ data: { adminId, tokenHash: tokenHash(token), expiresAt } }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: Math.floor(SESSION_LENGTH_MS / 1000),
  });
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.adminSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { admin: { select: { id: true, email: true } } },
  });

  if (!session) return null;
  if (isSessionExpired(session.expiresAt)) {
    await db.adminSession.deleteMany({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return { id: session.admin.id, email: session.admin.email };
}

// Legacy AdminSession has no role or membership columns. Never derive either
// from request data or from extra properties on a session/user object.
export async function requireLegacyAdminPermission(request: AuthorizationRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const identity: DealerAdministrator = {
    role: "dealer-admin",
    subjectId: admin.id,
    scope: LEGACY_DEALER_SCOPE,
  };
  if (!allowsPermission(identity, request)) throw new Error("Dealer admin permission denied.");
  return admin;
}

// Existing Admin entry points explicitly use the single-dealer compatibility
// path. Future membership-based accounts require their own verified resolver.
export async function requireAdmin() {
  return requireLegacyAdminPermission({ permission: "dealer:operate", scope: LEGACY_DEALER_SCOPE });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await db.adminSession.deleteMany({
      where: { tokenHash: tokenHash(token) },
    });
  }

  cookieStore.delete(COOKIE_NAME);
}

export async function cleanupExpiredAdminSessions(now = new Date()) {
  return db.adminSession.deleteMany({
    where: { expiresAt: { lte: now } },
    limit: EXPIRED_SESSION_CLEANUP_LIMIT,
  });
}
