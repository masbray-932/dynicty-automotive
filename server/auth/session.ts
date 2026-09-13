import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { getServerEnv } from "@/server/env";

const COOKIE_NAME = "dynicty_admin_session";
const SESSION_LENGTH_MS = 1000 * 60 * 60 * 24 * 7;

function tokenHash(token: string) {
  return createHmac("sha256", getServerEnv().SESSION_SECRET)
    .update(token)
    .digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LENGTH_MS);

  await db.adminSession.create({
    data: { adminId, tokenHash: tokenHash(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.adminSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { admin: { select: { id: true, email: true } } },
  });

  if (!session || session.expiresAt <= new Date()) return null;
  return session.admin;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
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
