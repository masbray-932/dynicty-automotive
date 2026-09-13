import Link from "next/link";
import { EmptyState } from "@/components/ui/states";

export default function AdminCarsPage() {
  return (
    <section>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Kelola Mobil</h1>
        <Link className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white" href="/admin/cars/new">Fondasi tambah mobil</Link>
      </div>
      <EmptyState title="CRUD belum diaktifkan" description="Admin Car CRUD dimulai pada Phase 1." />
    </section>
  );
}
