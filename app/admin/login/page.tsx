import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { getCurrentAdmin } from "@/server/auth/session";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Admin aman</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Masuk ke dealer</h1>
        <p className="mb-8 mt-3 text-sm leading-6 text-zinc-400">Gunakan akun admin yang dibuat melalui proses seed aman.</p>
        <LoginForm />
      </Card>
    </main>
  );
}
