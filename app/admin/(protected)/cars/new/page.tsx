import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { db } from "@/db/client";
import { CarForm } from "@/features/cars/car-form";
import { createCarAction } from "@/server/cars/actions";

export default async function NewCarPage() {
  await connection();
  const brands = await db.brand.findMany({ orderBy: { name: "asc" }, include: { models: { orderBy: { name: "asc" }, select: { id: true, name: true } } } });
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-white">Tambah Mobil</h1><p className="mt-2 text-zinc-400">Lengkapi data kendaraan. Gambar dapat ditambahkan setelah mobil dibuat.</p></div>
      {brands.length === 0 ? <Card className="border-amber-500/30"><p className="text-amber-200">Tambahkan merek dan model terlebih dahulu.</p><Link className="mt-3 inline-block text-sm font-semibold text-white underline" href="/admin/brands">Buka Merek & Model</Link></Card> : <Card><CarForm action={createCarAction} brands={brands} submitLabel="Simpan dan kelola gambar" /></Card>}
    </div>
  );
}
