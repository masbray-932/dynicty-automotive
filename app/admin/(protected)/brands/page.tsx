import { connection } from "next/server";
import { db } from "@/db/client";
import { BrandForm, ModelForm } from "@/features/master-data/master-data-forms";
import { requireAdmin } from "@/server/auth/session";
import { standaloneOwner, standaloneModel } from "@/server/standalone/inventory";
import { AdminEditorPanel } from "@/components/admin/admin-editor-panel";
import { AdminEmptyState, AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { brandLogoUrl } from "@/server/master-data/brand-media";

export default async function BrandManagementPage() {
  await requireAdmin();
  await connection();
  const brands = await db.brand.findMany({ where: standaloneOwner, orderBy: { name: "asc" }, include: { models: { where: standaloneModel, orderBy: { name: "asc" } } } });
  const brandOptions = brands.map(({ id, name }) => ({ id, name }));
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <AdminPageHeader eyebrow="Data kendaraan" title="Merek & Model" description="Kelola pilihan merek dan model yang digunakan pada formulir mobil tanpa menampilkan identitas internal." />
      <AdminSection title="Tambah data" description="Form hanya dibuka saat dibutuhkan agar halaman tetap ringkas."><div className="grid gap-3 sm:grid-cols-2"><AdminEditorPanel label="Tambah merek" title="Merek baru"><BrandForm /></AdminEditorPanel><AdminEditorPanel label="Tambah model" title="Model baru"><ModelForm brands={brandOptions} /></AdminEditorPanel></div></AdminSection>
      <AdminSection title={`Daftar merek (${brands.length})`} description="Pilih Edit untuk mengubah satu data. Perubahan merek atau model akan dikonfirmasi sebelum disimpan.">
        {brands.length ? <div className="grid gap-4 lg:grid-cols-2">{brands.map((brand) => <article className="rounded-xl border border-white/10 bg-black/20 p-4" key={brand.id}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-white">{brand.name}</h3><p className="mt-1 text-xs text-zinc-400">{brand.models.length} model · Urutan {brand.sortOrder} · {brand.active ? "Aktif" : "Nonaktif"}</p></div><AdminEditorPanel label="Edit merek" title={`Edit ${brand.name}`}><BrandForm brand={{ id: brand.id, name: brand.name, active: brand.active, sortOrder: brand.sortOrder, logoUrl: brandLogoUrl(brand.logoStorageKey) }} /></AdminEditorPanel></div>
          <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">{brand.models.length ? brand.models.map((model) => <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3" key={model.id}><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-zinc-200">{model.name}</p><AdminEditorPanel label="Edit" title={`Edit model ${model.name}`}><ModelForm brands={brandOptions} model={{ id: model.id, brandId: model.brandId, name: model.name }} /></AdminEditorPanel></div></div>) : <p className="text-sm text-zinc-500">Belum ada model untuk merek ini.</p>}</div>
        </article>)}</div> : <AdminEmptyState title="Belum ada merek" description="Tambahkan merek pertama, lalu buat model yang terkait." />}
      </AdminSection>
    </div>
  );
}
