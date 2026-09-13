import { CarStatus, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { db } from "@/db/client";
import { DeleteCarButton } from "@/features/cars/delete-car-button";
import { formatDate, formatRupiah } from "@/lib/format";
import { getStorageProvider } from "@/services/storage";

const statusLabels = { DRAFT: "Draft", AVAILABLE: "Tersedia", SOLD: "Terjual" } as const;

export default async function AdminCarsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; notice?: string }> }) {
  await connection();
  const query = await searchParams;
  const status = Object.values(CarStatus).includes(query.status as CarStatus) ? query.status as CarStatus : undefined;
  const searchFilter: Prisma.CarWhereInput[] = query.q ? [
    { variant: { contains: query.q, mode: "insensitive" } },
    { slug: { contains: query.q, mode: "insensitive" } },
    { brand: { name: { contains: query.q, mode: "insensitive" } } },
    { model: { name: { contains: query.q, mode: "insensitive" } } },
  ] : [];
  const cars = await db.car.findMany({
    where: { ...(status ? { status } : {}), ...(searchFilter.length ? { OR: searchFilter } : {}) },
    orderBy: { updatedAt: "desc" },
    include: { brand: true, model: true, images: { where: { isPrimary: true }, take: 1 } },
  });
  const storage = cars.some((car) => car.images.length) ? getStorageProvider() : null;
  const notice = query.notice === "deleted" ? "Mobil berhasil dihapus." : query.notice === "deleted-cleanup-warning" ? "Mobil dihapus, tetapi sebagian media perlu dibersihkan manual." : "";
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-white">Kelola Mobil</h1><p className="mt-2 text-zinc-400">{cars.length} kendaraan ditemukan</p></div><Link className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white" href="/admin/cars/new">Tambah mobil</Link></div>
      {notice ? <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{notice}</p> : null}
      <form className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-zinc-900 p-4 sm:grid-cols-[1fr_180px_auto]" method="get"><input className="min-h-11 rounded-lg border border-white/15 bg-black/30 px-4" defaultValue={query.q} name="q" placeholder="Cari mobil" /><select className="min-h-11 rounded-lg border border-white/15 bg-zinc-950 px-4" defaultValue={status ?? ""} name="status"><option value="">Semua status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="rounded-lg bg-white px-4 font-semibold text-black" type="submit">Filter</button></form>
      {cars.length === 0 ? <EmptyState title="Inventori kosong" description="Tambahkan mobil pertama atau ubah filter pencarian." /> : (
        <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-white/5 text-zinc-400"><tr><th className="p-3">Mobil</th><th className="p-3">Kondisi</th><th className="p-3">Tahun</th><th className="p-3">Harga</th><th className="p-3">Status</th><th className="p-3">Diperbarui</th><th className="p-3">Aksi</th></tr></thead><tbody>{cars.map((car) => {
          const label = `${car.brand.name} ${car.model.name} ${car.variant}`;
          return <tr className="border-t border-white/10" key={car.id}><td className="p-3"><div className="flex items-center gap-3">{car.images[0] && storage ? <Image alt={`Cover ${label}`} className="h-14 w-20 rounded-lg object-cover" height={56} src={storage.publicUrl(car.images[0].storageKey)} unoptimized width={80} /> : <div className="grid h-14 w-20 place-items-center rounded-lg bg-white/5 text-xs text-zinc-500">No image</div>}<div><p className="font-semibold text-white">{label}</p><p className="text-xs text-zinc-500">{car.slug}</p></div></div></td><td className="p-3">{car.condition === "NEW" ? "Baru" : "Bekas"}</td><td className="p-3">{car.year}</td><td className="p-3">{formatRupiah(car.price)}</td><td className="p-3"><Badge>{statusLabels[car.status]}</Badge></td><td className="p-3">{formatDate(car.updatedAt)}</td><td className="p-3"><div className="flex gap-2"><Link className="rounded-lg border border-white/15 px-3 py-2 font-semibold hover:bg-white/10" href={`/admin/cars/${car.id}/edit`}>Edit</Link><DeleteCarButton id={car.id} label={label} /></div></td></tr>;
        })}</tbody></table></div>
      )}
    </section>
  );
}
