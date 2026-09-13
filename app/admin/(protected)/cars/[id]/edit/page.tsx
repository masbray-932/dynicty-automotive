import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { db } from "@/db/client";
import { CarForm } from "@/features/cars/car-form";
import { ImageManager } from "@/features/cars/image-manager";
import { updateCarAction } from "@/server/cars/actions";
import { getStorageProvider } from "@/services/storage";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> };

export default async function EditCarPage({ params, searchParams }: PageProps) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [car, brands] = await Promise.all([
    db.car.findUnique({ where: { id }, include: { brand: true, model: true, images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } }),
    db.brand.findMany({ orderBy: { name: "asc" }, include: { models: { orderBy: { name: "asc" }, select: { id: true, name: true } } } }),
  ]);
  if (!car) notFound();
  const storage = getStorageProvider();
  const images = car.images.map((image) => ({ id: image.id, isPrimary: image.isPrimary, sortOrder: image.sortOrder, url: storage.publicUrl(image.storageKey) }));
  const updateAction = updateCarAction.bind(null, car.id);
  const notice = query.notice === "created" ? "Mobil berhasil dibuat. Tambahkan gambar di bawah." : query.notice === "image-deleted" ? "Gambar berhasil dihapus." : query.notice === "image-cleanup-warning" ? "Data gambar dihapus, tetapi file storage perlu dibersihkan manual." : "";
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold text-white">Edit {car.brand.name} {car.model.name}</h1><p className="mt-2 text-zinc-400">Slug: {car.slug}</p>{notice ? <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{notice}</p> : null}</div>
      <Card><CarForm action={updateAction} brands={brands} defaults={{ condition: car.condition, brandId: car.brandId, modelId: car.modelId, variant: car.variant, year: car.year, price: car.price.toFixed(0), transmission: car.transmission, fuelType: car.fuelType, color: car.color, mileage: car.mileage, description: car.description, status: car.status, featured: car.featured }} submitLabel="Simpan perubahan" /></Card>
      <Card><h2 className="mb-5 text-xl font-semibold text-white">Gambar Mobil</h2><ImageManager carId={car.id} images={images} /></Card>
    </div>
  );
}
