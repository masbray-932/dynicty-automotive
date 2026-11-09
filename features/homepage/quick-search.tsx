"use client";

import { useMemo, useState } from "react";
import type { HomepageBrand } from "@/server/homepage/service";

export function QuickSearch({ brands }: { brands: HomepageBrand[] }) {
  const [brand, setBrand] = useState("");
  const models = useMemo(() => brands.find((item) => item.slug === brand)?.models ?? [], [brand, brands]);

  return (
    <form action="/cars" className="grid gap-4 rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-[0_12px_32px_-16px_rgba(23,23,23,0.18)] sm:grid-cols-2 lg:grid-cols-3" method="get">
      <label className="grid gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#606060]">
        Kondisi
        <select className="public-control px-3 text-sm font-normal normal-case" name="condition" defaultValue="">
          <option value="">Semua kondisi</option>
          <option value="NEW">Mobil baru</option>
          <option value="USED">Mobil bekas</option>
        </select>
      </label>
      <label className="grid gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#606060]">
        Merek
        <select className="public-control px-3 text-sm font-normal normal-case" name="brand" value={brand} onChange={(event) => setBrand(event.target.value)}>
          <option value="">Semua merek</option>
          {brands.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#606060]">
        Model
        <select className="public-control px-3 text-sm font-normal normal-case disabled:bg-[#F6F6F6] disabled:text-[#8E8E93]" disabled={!brand || models.length === 0} name="model" defaultValue="" key={brand}>
          <option value="">Semua model</option>
          {models.map((model) => <option key={model.slug} value={model.slug}>{model.name}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#606060] sm:col-span-2 lg:col-span-1">
        Kata kunci
        <input className="public-control px-3 text-sm font-normal normal-case placeholder:text-[#8E8E93]" name="q" placeholder="Contoh: Avanza G" type="search" />
      </label>
      <label className="grid gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#606060]">Harga minimum (Rp)<input className="public-control px-3 font-normal" name="minPrice" type="number" min="0" max="999999999999999" step="1" /></label>
      <label className="grid gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#606060]">Harga maksimum (Rp)<input className="public-control px-3 font-normal" name="maxPrice" type="number" min="0" max="999999999999999" step="1" /></label>
      <button className="min-h-11 self-end rounded bg-brand-primary px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-on-primary transition hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus sm:col-span-2 lg:col-span-1" type="submit">
        Cari Mobil
      </button>
    </form>
  );
}
