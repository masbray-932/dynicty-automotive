"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveBrandAction, saveModelAction } from "@/server/master-data/actions";
import { emptyActionState } from "@/types/action-state";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { brandConfirmation, modelConfirmation } from "@/features/admin/confirmation-policy";
import Image from "next/image";

export function BrandForm({ brand }: { brand?: { id: string; name: string; active: boolean; sortOrder: number; logoUrl: string | null } }) {
  const [state, action, pending] = useActionState(saveBrandAction, emptyActionState);
  const fieldId = brand ? `brand-${brand.id}-name` : "brand-new-name";
  const errorId = `${fieldId}-error`;
  return (
    <ConfirmationForm action={action} confirmation={data => brandConfirmation(brand, data)} className="grid gap-4" encType="multipart/form-data">
      {brand ? <input name="id" type="hidden" value={brand.id} /> : null}
      <div className="min-w-0">
        <Input aria-describedby={state.errors.name?.[0] ? errorId : undefined} aria-invalid={state.errors.name?.[0] ? true : undefined} aria-label={brand ? `Ubah merek ${brand.name}` : "Nama merek baru"} defaultValue={brand?.name} id={fieldId} name="name" placeholder="Contoh: Toyota" required />
        {state.errors.name?.[0] ? <p className="mt-1 text-xs text-red-300" id={errorId} role="alert">{state.errors.name[0]}</p> : null}
        {state.message ? <p aria-live="polite" className="mt-1 text-xs text-zinc-400">{state.message}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium text-zinc-200">Urutan tampil<Input defaultValue={brand?.sortOrder ?? 0} min={0} max={999} name="sortOrder" type="number" /></label><label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/15 px-4 text-sm"><input defaultChecked={brand?.active ?? true} name="active" type="checkbox" />Aktif di kategori merek publik</label></div>
      <div className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-[6rem_1fr] sm:items-center">{brand?.logoUrl ? <Image alt={`Logo ${brand.name}`} className="h-20 w-24 rounded-lg bg-white object-contain p-2" height={80} src={brand.logoUrl} unoptimized width={96} /> : <div className="grid h-20 w-24 place-items-center rounded-lg bg-white/5 text-center text-xs text-zinc-500">Tanpa logo</div>}<div><label className="grid gap-2 text-sm font-medium text-zinc-200">{brand?.logoUrl ? "Ganti logo" : "Logo opsional"}<input accept="image/jpeg,image/png,image/webp" className="min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 p-2 text-sm" name="logo" type="file" /></label>{state.errors.logo?.[0] ? <p className="mt-1 text-xs text-red-300" role="alert">{state.errors.logo[0]}</p> : null}{brand?.logoUrl ? <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300"><input name="removeLogo" type="checkbox" />Hapus logo tersimpan</label> : null}</div></div>
      <Button className="w-fit" disabled={pending} type="submit" variant={brand ? "secondary" : "primary"}>{brand ? "Simpan merek" : "Tambah merek"}</Button>
    </ConfirmationForm>
  );
}

export function ModelForm({ brands, model }: { brands: { id: string; name: string }[]; model?: { id: string; brandId: string; name: string } }) {
  const [state, action, pending] = useActionState(saveModelAction, emptyActionState);
  const fieldId = model ? `model-${model.id}-name` : "model-new-name";
  const errorId = `${fieldId}-error`;
  return (
    <ConfirmationForm action={action} confirmation={data => modelConfirmation(model, data)} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      {model ? <input name="id" type="hidden" value={model.id} /> : null}
      <select aria-label="Merek model" className="min-h-11 rounded-xl border border-white/15 bg-zinc-950 px-4" defaultValue={model?.brandId ?? ""} name="brandId" required>
        <option disabled value="">Pilih merek</option>
        {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
      </select>
      <div>
        <Input aria-describedby={state.errors.name?.[0] ? errorId : undefined} aria-invalid={state.errors.name?.[0] ? true : undefined} aria-label={model ? `Ubah model ${model.name}` : "Nama model baru"} defaultValue={model?.name} id={fieldId} name="name" placeholder="Contoh: Avanza" required />
        {state.errors.name?.[0] ? <p className="mt-1 text-xs text-red-300" id={errorId} role="alert">{state.errors.name[0]}</p> : null}
        {state.message ? <p aria-live="polite" className="mt-1 text-xs text-zinc-400">{state.message}</p> : null}
      </div>
      <Button disabled={pending || brands.length === 0} type="submit" variant={model ? "secondary" : "primary"}>{model ? "Simpan" : "Tambah model"}</Button>
    </ConfirmationForm>
  );
}
