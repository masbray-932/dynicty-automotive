import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/server/auth/session";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen lg:flex">
      <AdminNav />
      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <p className="text-sm text-zinc-400">Sesi aktif: {admin.email}</p>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Protected</span>
        </div>
        {children}
      </main>
    </div>
  );
}
