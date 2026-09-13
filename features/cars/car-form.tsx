"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/types/action-state";
import { emptyActionState } from "@/types/action-state";

type BrandOption = { id: string; name: string; models: { id: string; name: string }[] };
type CarDefaults = {
  condition: "NEW" | "USED";
  brandId: string;
  modelId: string;
  variant: string;
  year: number;
  price: string;
  transmission: string;
  fuelType: string;
  color: string;
  mileage: number | null;
  description: string;
  status: "DRAFT" | "AVAILABLE" | "SOLD";
  featured: boolean;
};

export function CarForm({ action, brands, defaults, submitLabel }: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  brands: BrandOption[];
  defaults?: CarDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, emptyActionState);
  const [brandId, setBrandId] = useState(defaults?.brandId ?? brands[0]?.id ?? "");
  const models = useMemo(() => brands.find((brand) => brand.id === brandId)?.models ?? [], [brandId, brands]);
  const field = (name: string) => state.errors[name]?.[0];
  const selectClass = "min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 text-white focus:border-red-500 focus:outline-none";

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-2">
      <FormField error={field("condition")} htmlFor="condition" label="Kondisi">
        <select className={selectClass} defaultValue={defaults?.condition ?? "USED"} id="condition" name="condition"><option value="NEW">Baru</option><option value="USED">Bekas</option></select>
      </FormField>
      <FormField error={field("status")} htmlFor="status" label="Status">
        <select className={selectClass} defaultValue={defaults?.status ?? "DRAFT"} id="status" name="status"><option value="DRAFT">Draft</option><option value="AVAILABLE">Tersedia</option><option value="SOLD">Terjual</option></select>
      </FormField>
      <FormField error={field("brandId")} htmlFor="brandId" label="Merek">
        <select className={selectClass} id="brandId" name="brandId" onChange={(event) => setBrandId(event.target.value)} value={brandId} required>
          <option disabled value="">Pilih merek</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
      </FormField>
      <FormField error={field("modelId")} htmlFor="modelId" label="Model">
        <select className={selectClass} defaultValue={defaults?.brandId === brandId ? defaults.modelId : ""} id="modelId" key={brandId} name="modelId" required>
          <option disabled value="">Pilih model</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
        </select>
      </FormField>
      <FormField error={field("variant")} htmlFor="variant" label="Varian"><Input defaultValue={defaults?.variant} id="variant" name="variant" placeholder="1.5 G CVT" required /></FormField>
      <FormField error={field("year")} htmlFor="year" label="Tahun"><Input defaultValue={defaults?.year ?? new Date().getFullYear()} id="year" inputMode="numeric" name="year" required type="number" /></FormField>
      <FormField error={field("price")} htmlFor="price" label="Harga (Rupiah)"><Input defaultValue={defaults?.price} id="price" inputMode="numeric" name="price" placeholder="225000000" required /></FormField>
      <FormField error={field("mileage")} htmlFor="mileage" label="Kilometer"><Input defaultValue={defaults?.mileage ?? ""} id="mileage" inputMode="numeric" name="mileage" placeholder="25000" /></FormField>
      <FormField error={field("transmission")} htmlFor="transmission" label="Transmisi"><Input defaultValue={defaults?.transmission} id="transmission" name="transmission" placeholder="Automatic" required /></FormField>
      <FormField error={field("fuelType")} htmlFor="fuelType" label="Bahan bakar"><Input defaultValue={defaults?.fuelType} id="fuelType" name="fuelType" placeholder="Bensin" required /></FormField>
      <FormField error={field("color")} htmlFor="color" label="Warna"><Input defaultValue={defaults?.color} id="color" name="color" placeholder="Hitam" required /></FormField>
      <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-white/15 px-4 text-sm"><input defaultChecked={defaults?.featured} name="featured" type="checkbox" />Tampilkan sebagai unggulan</label>
      <div className="lg:col-span-2">
        <FormField error={field("description")} htmlFor="description" label="Deskripsi">
          <textarea className={`${selectClass} min-h-36 py-3`} defaultValue={defaults?.description} id="description" name="description" required />
        </FormField>
      </div>
      <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
        <Button disabled={pending || brands.length === 0} type="submit">{pending ? "Menyimpan…" : submitLabel}</Button>
        {state.message ? <p aria-live="polite" className={state.errors && Object.keys(state.errors).length ? "text-sm text-red-300" : "text-sm text-emerald-300"}>{state.message}</p> : null}
      </div>
    </form>
  );
}
