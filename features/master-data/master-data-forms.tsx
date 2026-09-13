"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveBrandAction, saveModelAction } from "@/server/master-data/actions";
import { emptyActionState } from "@/types/action-state";

export function BrandForm({ brand }: { brand?: { id: string; name: string } }) {
  const [state, action, pending] = useActionState(saveBrandAction, emptyActionState);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      {brand ? <input name="id" type="hidden" value={brand.id} /> : null}
      <div className="min-w-0 flex-1">
        <Input aria-label={brand ? `Ubah merek ${brand.name}` : "Nama merek baru"} defaultValue={brand?.name} name="name" placeholder="Contoh: Toyota" required />
        {state.errors.name?.[0] ? <p className="mt-1 text-xs text-red-300">{state.errors.name[0]}</p> : null}
        {state.message ? <p aria-live="polite" className="mt-1 text-xs text-zinc-400">{state.message}</p> : null}
      </div>
      <Button disabled={pending} type="submit" variant={brand ? "secondary" : "primary"}>{brand ? "Simpan" : "Tambah merek"}</Button>
    </form>
  );
}

export function ModelForm({ brands, model }: { brands: { id: string; name: string }[]; model?: { id: string; brandId: string; name: string } }) {
  const [state, action, pending] = useActionState(saveModelAction, emptyActionState);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      {model ? <input name="id" type="hidden" value={model.id} /> : null}
      <select aria-label="Merek model" className="min-h-11 rounded-xl border border-white/15 bg-zinc-950 px-4" defaultValue={model?.brandId ?? ""} name="brandId" required>
        <option disabled value="">Pilih merek</option>
        {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
      </select>
      <div>
        <Input aria-label={model ? `Ubah model ${model.name}` : "Nama model baru"} defaultValue={model?.name} name="name" placeholder="Contoh: Avanza" required />
        {state.message ? <p aria-live="polite" className="mt-1 text-xs text-zinc-400">{state.message}</p> : null}
      </div>
      <Button disabled={pending || brands.length === 0} type="submit" variant={model ? "secondary" : "primary"}>{model ? "Simpan" : "Tambah model"}</Button>
    </form>
  );
}
