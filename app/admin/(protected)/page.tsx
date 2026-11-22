import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRupiah } from "@/lib/format";
import { getDashboardData } from "@/server/dashboard/service";
import { requireAdmin } from "@/server/auth/session";
import { AdminActionLink, AdminEmptyState, AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";

const statusLabels = { DRAFT: "Draft", AVAILABLE: "Tersedia", SOLD: "Terjual" } as const;

export default async function AdminDashboardPage() {
  await requireAdmin();
  await connection();
  const result = await getDashboardData();
  if (result.kind === "error") return <section><h1 className="text-3xl font-bold text-white">Dashboard</h1><div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6" role="alert"><h2 className="font-bold text-white">Data dashboard tidak dapat dimuat</h2><p className="mt-2 text-sm text-zinc-300">Silakan coba kembali beberapa saat lagi. Nilai nol tidak ditampilkan karena koneksi database belum terverifikasi.</p></div></section>;
  const { metrics, recent } = result;
  const primary = [["Total Mobil", metrics.total], ["Tersedia", metrics.available], ["Draft", metrics.draft], ["Terjual", metrics.sold]];
  const secondary = [["Mobil Baru", metrics.newCars], ["Mobil Bekas", metrics.usedCars], ["Featured", metrics.featured]];
  return (
    <section className="mx-auto max-w-7xl">
      <AdminPageHeader eyebrow="Ringkasan dealer" title="Dashboard" description="Pantau inventori terbaru dan buka tugas Admin yang paling sering digunakan." actions={<><AdminActionLink href="/admin/cars/new">Tambah Mobil</AdminActionLink><AdminActionLink href="/admin/cars" secondary>Kelola Mobil</AdminActionLink><AdminActionLink href="/admin/settings" secondary>Pengaturan</AdminActionLink><AdminActionLink href="/" secondary>Lihat Website</AdminActionLink></>} />
      <section aria-labelledby="inventory-summary" className="mt-8"><h2 className="sr-only" id="inventory-summary">Ringkasan inventori</h2><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{primary.map(([label, value]) => <article className="rounded-2xl border border-white/10 bg-zinc-900 p-5" key={label}><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-3 text-3xl font-black text-white">{value}</p></article>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-3">{secondary.map(([label, value]) => <article className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4" key={label}><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></article>)}</div></section>
      <AdminSection className="mt-10" title="Mobil Terakhir Diperbarui" actions={<AdminActionLink href="/admin/cars" secondary>Semua mobil</AdminActionLink>}>{recent.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-zinc-400"><tr><th className="p-3">Mobil</th><th className="p-3">Kondisi</th><th className="p-3">Status</th><th className="p-3">Harga</th><th className="p-3">Diperbarui</th><th className="p-3">Aksi</th></tr></thead><tbody>{recent.map((car) => <tr className="border-t border-white/10" key={car.id}><td className="p-3 font-semibold text-white">{car.title}</td><td className="p-3">{car.condition === "NEW" ? "Baru" : "Bekas"}</td><td className="p-3"><Badge>{statusLabels[car.status]}</Badge></td><td className="p-3">{formatRupiah(car.price)}</td><td className="p-3 text-zinc-400">{formatDate(car.updatedAt)}</td><td className="p-3"><Link className="rounded-lg border border-white/15 px-3 py-2 font-semibold text-white" href={`/admin/cars/${car.id}/edit`}>Edit mobil</Link></td></tr>)}</tbody></table></div> : <AdminEmptyState title="Inventori masih kosong" description="Tambahkan mobil pertama untuk mulai mengisi dashboard." action={<AdminActionLink href="/admin/cars/new">Tambah Mobil</AdminActionLink>} />}</AdminSection>
    </section>
  );
}
