import { Card } from "@/components/ui/card";
import { connection } from "next/server";
import { db } from "@/db/client";
import { BrandForm, ModelForm } from "@/features/master-data/master-data-forms";

export default async function BrandManagementPage() {
  await connection();
  const brands = await db.brand.findMany({ orderBy: { name: "asc" }, include: { models: { orderBy: { name: "asc" } } } });
  const brandOptions = brands.map(({ id, name }) => ({ id, name }));
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold text-white">Merek & Model</h1><p className="mt-2 text-zinc-400">Data ini menjadi pilihan dinamis pada formulir mobil.</p></div>
      <Card><h2 className="mb-4 text-xl font-semibold text-white">Tambah merek</h2><BrandForm /></Card>
      <Card><h2 className="mb-4 text-xl font-semibold text-white">Tambah model</h2><ModelForm brands={brandOptions} /></Card>
      <div className="grid gap-5 lg:grid-cols-2">
        {brands.map((brand) => <Card key={brand.id}><BrandForm brand={{ id: brand.id, name: brand.name }} /><div className="mt-5 space-y-3 border-t border-white/10 pt-5">{brand.models.length ? brand.models.map((model) => <ModelForm brands={brandOptions} key={model.id} model={{ id: model.id, brandId: model.brandId, name: model.name }} />) : <p className="text-sm text-zinc-500">Belum ada model.</p>}</div></Card>)}
      </div>
    </div>
  );
}
