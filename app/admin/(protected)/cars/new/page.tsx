import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { db } from "@/db/client";
import { CarForm } from "@/features/cars/car-form";
import { createCarAction } from "@/server/cars/actions";
import { requireAdmin } from "@/server/auth/session";
import { standaloneOwner, standaloneModel } from "@/server/standalone/inventory";
import { AdminFormGuard } from "@/components/admin/admin-form-guard";
import { AdminActionLink, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function NewCarPage() {
  await requireAdmin();
  await connection();
  const brands = await db.brand.findMany({ where: standaloneOwner, orderBy: { name: "asc" }, include: { models: { where: standaloneModel, orderBy: { name: "asc" }, select: { id: true, name: true } } } });
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <AdminPageHeader eyebrow="Inventori" title="Tambah Mobil" description="Lengkapi data kendaraan. Gambar dapat ditambahkan setelah mobil dibuat." actions={<AdminActionLink href="/admin/cars" secondary>Kembali</AdminActionLink>} />
      {brands.length === 0 ? <Card className="border-amber-500/30"><p className="text-amber-200">Tambahkan merek dan model terlebih dahulu.</p><Link className="mt-3 inline-block text-sm font-semibold text-white underline" href="/admin/brands">Buka Merek & Model</Link></Card> : <Card><AdminFormGuard><CarForm action={createCarAction} brands={brands} submitLabel="Simpan dan kelola gambar" /></AdminFormGuard></Card>}
    </div>
  );
}
