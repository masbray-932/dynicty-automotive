"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { verifyPassword } from "@/server/auth/password";
import { createAdminSession, destroyAdminSession } from "@/server/auth/session";
import { loginSchema } from "@/validation/auth";

export type LoginState = {
  message: string;
  errors: Record<string, string[]>;
};

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

  const admin = await db.adminUser.findUnique({ where: { email: result.data.email } });
  const passwordIsValid = admin
    ? await verifyPassword(result.data.password, admin.passwordHash)
    : false;

  if (!admin || !passwordIsValid) {
    return { message: "Email atau kata sandi tidak sesuai.", errors: {} };
  }

  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
