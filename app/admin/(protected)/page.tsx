import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRupiah } from "@/lib/format";
import { getDashboardData } from "@/server/dashboard/service";

const statusLabels = { DRAFT: "Draft", AVAILABLE: "Tersedia", SOLD: "Terjual" } as const;

export default async function AdminDashboardPage() {
  await connection();
  const result = await getDashboardData();
  if (result.kind === "error") return <section><h1 className="text-3xl font-bold text-white">Dashboard</h1><div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6" role="alert"><h2 className="font-bold text-white">Data dashboard tidak dapat dimuat</h2><p className="mt-2 text-sm text-zinc-300">Silakan coba kembali beberapa saat lagi. Nilai nol tidak ditampilkan karena koneksi database belum terverifikasi.</p></div></section>;
  const { metrics, recent } = result;
  const primary = [["Total Mobil", metrics.total], ["Tersedia", metrics.available], ["Draft", metrics.draft], ["Terjual", metrics.sold]];
  const secondary = [["Mobil Baru", metrics.newCars], ["Mobil Bekas", metrics.usedCars], ["Featured", metrics.featured]];
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-white">Dashboard</h1><p className="mt-2 text-zinc-400">Ringkasan inventori dealer terbaru.</p></div><div className="flex flex-wrap gap-2"><Link className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white" href="/admin/cars/new">Tambah Mobil</Link><Link className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white" href="/admin/cars">Kelola Mobil</Link><Link className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white" href="/admin/settings">Pengaturan Dealer</Link><Link className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white" href="/">Lihat Website</Link></div></div>
      <section aria-labelledby="inventory-summary" className="mt-8"><h2 className="sr-only" id="inventory-summary">Ringkasan inventori</h2><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{primary.map(([label, value]) => <article className="rounded-2xl border border-white/10 bg-zinc-900 p-5" key={label}><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-3 text-3xl font-black text-white">{value}</p></article>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-3">{secondary.map(([label, value]) => <article className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4" key={label}><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></article>)}</div></section>
      <section className="mt-10" aria-labelledby="recent-cars"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-white" id="recent-cars">Mobil Terakhir Diperbarui</h2><Link className="text-sm font-semibold text-red-400" href="/admin/cars">Semua mobil →</Link></div>{recent.length ? <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-white/5 text-zinc-400"><tr><th className="p-3">Mobil</th><th className="p-3">Kondisi</th><th className="p-3">Status</th><th className="p-3">Harga</th><th className="p-3">Diperbarui</th><th className="p-3">Aksi</th></tr></thead><tbody>{recent.map((car) => <tr className="border-t border-white/10" key={car.id}><td className="p-3 font-semibold text-white">{car.title}</td><td className="p-3">{car.condition === "NEW" ? "Baru" : "Bekas"}</td><td className="p-3"><Badge>{statusLabels[car.status]}</Badge></td><td className="p-3">{formatRupiah(car.price)}</td><td className="p-3 text-zinc-400">{formatDate(car.updatedAt)}</td><td className="p-3"><Link className="rounded-lg border border-white/15 px-3 py-2 font-semibold text-white" href={`/admin/cars/${car.id}/edit`}>Edit mobil</Link></td></tr>)}</tbody></table></div> : <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-8 text-center"><h3 className="font-bold text-white">Inventori masih kosong</h3><p className="mt-2 text-sm text-zinc-400">Tambahkan mobil pertama untuk mulai mengisi dashboard.</p><Link className="mt-5 inline-flex rounded-xl bg-red-600 px-5 py-3 font-bold text-white" href="/admin/cars/new">Tambah Mobil</Link></div>}</section>
    </section>
  );
}
