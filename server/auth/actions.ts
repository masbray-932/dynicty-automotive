"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { resolveClientIdentifier } from "@/server/auth/client-ip";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { clearLoginFailures, loginLimitState, recordLoginFailure } from "@/server/auth/login-limiter";
import { createAdminSession, destroyAdminSession } from "@/server/auth/session";
import { logger } from "@/server/log";
import { getServerEnv } from "@/server/env";
import { loginSchema } from "@/validation/auth";

export type LoginState = {
  message: string;
  errors: Record<string, string[]>;
};

let dummyPasswordHash: Promise<string> | undefined;

function getDummyPasswordHash() {
  dummyPasswordHash ??= hashPassword("Dynicty-invalid-login-comparison-only");
  return dummyPasswordHash;
}

async function loginThrottleKeys(email: string) {
  const headerStore = await headers();
  const client = resolveClientIdentifier(headerStore, getServerEnv().TRUST_PROXY === "true");
  const digest = (value: string) => createHash("sha256").update(value).digest("hex");
  return [digest(`client:${client}`), digest(`client-email:${client}:${email}`)];
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      message: "Periksa kembali data yang dimasukkan.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const throttleKeys = await loginThrottleKeys(result.data.email);
  if (throttleKeys.some((key) => !loginLimitState(key).allowed)) {
    logger.warn("admin.login_throttled");
    return { message: "Login belum dapat diproses. Tunggu beberapa menit lalu coba kembali.", errors: {} };
  }

  let admin;
  try {
    admin = await db.adminUser.findUnique({ where: { email: result.data.email } });
  } catch {
    logger.error("admin.login_database_failure");
    return { message: "Login belum dapat diproses. Silakan coba kembali.", errors: {} };
  }
  const passwordIsValid = await verifyPassword(
    result.data.password,
    admin?.passwordHash ?? await getDummyPasswordHash(),
  );

  if (!admin || !passwordIsValid) {
    const blocked = throttleKeys.map((key) => recordLoginFailure(key)).some((state) => !state.allowed);
    logger.warn(blocked ? "admin.login_blocked" : "admin.login_failed");
    return { message: "Email atau kata sandi tidak sesuai.", errors: {} };
  }

  throttleKeys.forEach(clearLoginFailures);
  try {
    await createAdminSession(admin.id);
  } catch {
    logger.error("admin.session_create_failed", { adminId: admin.id });
    return { message: "Login belum dapat diproses. Silakan coba kembali.", errors: {} };
  }
  logger.info("admin.login_succeeded", { adminId: admin.id });
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession().catch(() => logger.warn("admin.logout_cleanup_failed"));
  logger.info("admin.logout");
  redirect("/admin/login");
}
