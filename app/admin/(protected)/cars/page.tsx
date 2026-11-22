import { CarStatus, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { db } from "@/db/client";
import { DeleteCarButton } from "@/features/cars/delete-car-button";
import { formatDate, formatRupiah } from "@/lib/format";
import { legacyVehicleImageUrl } from "@/server/storefront/media";
import { requireAdmin } from "@/server/auth/session";
import { standaloneOwner, standaloneCar } from "@/server/standalone/inventory";
import { AdminActionLink, AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";

const statusLabels = { DRAFT: "Draft", AVAILABLE: "Tersedia", SOLD: "Terjual" } as const;

type SearchParam = string | string[] | undefined;

function firstParam(value: SearchParam) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCarsPage({ searchParams }: { searchParams: Promise<{ q?: SearchParam; status?: SearchParam; notice?: SearchParam }> }) {
  await requireAdmin();
  await connection();
  const query = await searchParams;
  const search = firstParam(query.q)?.trim().slice(0, 100) ?? "";
  const requestedStatus = firstParam(query.status);
  const status = Object.values(CarStatus).includes(requestedStatus as CarStatus) ? requestedStatus as CarStatus : undefined;
  const searchFilter: Prisma.CarWhereInput[] = search ? [
    { variant: { contains: search, mode: "insensitive" } },
    { slug: { contains: search, mode: "insensitive" } },
    { brand: { name: { contains: search, mode: "insensitive" } } },
    { model: { name: { contains: search, mode: "insensitive" } } },
  ] : [];
  const cars = await db.car.findMany({
    where: { ...standaloneCar, ...(status ? { status } : {}), ...(searchFilter.length ? { OR: searchFilter } : {}) },
    orderBy: { updatedAt: "desc" },
    include: { brand: true, model: true, images: { where: { ...standaloneOwner, isPrimary: true }, take: 1 } },
  });
  const requestedNotice = firstParam(query.notice);
  const notice = requestedNotice === "deleted" ? "Mobil berhasil dihapus." : requestedNotice === "deleted-cleanup-warning" ? "Mobil dihapus, tetapi sebagian media perlu dibersihkan manual." : "";
  return (
    <section className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader eyebrow="Inventori" title="Kelola Mobil" description={`${cars.length} kendaraan ditemukan. Cari, filter, dan kelola status kendaraan dari satu tempat.`} actions={<AdminActionLink href="/admin/cars/new">Tambah mobil</AdminActionLink>} />
      {notice ? <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{notice}</p> : null}
      <AdminSection title="Pencarian dan filter"><form className="grid gap-3 sm:grid-cols-[1fr_180px_auto]" method="get"><label className="sr-only" htmlFor="admin-car-search">Cari mobil</label><input className="min-h-11 rounded-lg border border-white/15 bg-black/30 px-4" defaultValue={search} id="admin-car-search" maxLength={100} name="q" placeholder="Cari merek, model, varian, atau slug" /><label className="sr-only" htmlFor="admin-car-status">Status</label><select className="min-h-11 rounded-lg border border-white/15 bg-zinc-950 px-4" defaultValue={status ?? ""} id="admin-car-status" name="status"><option value="">Semua status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="min-h-11 rounded-lg bg-white px-4 font-semibold text-black focus-visible:outline-2 focus-visible:outline-brand-focus" type="submit">Terapkan</button></form></AdminSection>
      {cars.length === 0 ? <EmptyState title="Inventori kosong" description="Tambahkan mobil pertama atau ubah filter pencarian." /> : (
        <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-white/5 text-zinc-400"><tr><th className="p-3">Mobil</th><th className="p-3">Kondisi</th><th className="p-3">Tahun</th><th className="p-3">Harga</th><th className="p-3">Status</th><th className="p-3">Diperbarui</th><th className="p-3">Aksi</th></tr></thead><tbody>{cars.map((car) => {
          const coverUrl = legacyVehicleImageUrl(car.id, car.images[0]?.storageKey);
          const label = `${car.brand.name} ${car.model.name} ${car.variant}`;
          return <tr className="border-t border-white/10" key={car.id}><td className="p-3"><div className="flex items-center gap-3">{coverUrl ? <Image alt={`Cover ${label}`} className="h-14 w-20 rounded-lg object-cover" height={56} src={coverUrl} unoptimized width={80} /> : <div className="grid h-14 w-20 place-items-center rounded-lg bg-white/5 text-xs text-zinc-500">No image</div>}<div><p className="font-semibold text-white">{label}</p><p className="text-xs text-zinc-500">{car.slug}</p></div></div></td><td className="p-3">{car.condition === "NEW" ? "Baru" : "Bekas"}</td><td className="p-3">{car.year}</td><td className="p-3">{formatRupiah(car.price)}</td><td className="p-3"><Badge>{statusLabels[car.status]}</Badge></td><td className="p-3">{formatDate(car.updatedAt)}</td><td className="p-3"><div className="flex gap-2"><Link className="rounded-lg border border-white/15 px-3 py-2 font-semibold hover:bg-white/10" href={`/admin/cars/${car.id}/edit`}>Edit</Link><DeleteCarButton id={car.id} label={label} /></div></td></tr>;
        })}</tbody></table></div>
      )}
    </section>
  );
}
