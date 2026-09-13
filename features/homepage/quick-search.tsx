"use client";

import { useMemo, useState } from "react";
import type { HomepageBrand } from "@/server/homepage/service";

export function QuickSearch({ brands }: { brands: HomepageBrand[] }) {
  const [brand, setBrand] = useState("");
  const models = useMemo(() => brands.find((item) => item.slug === brand)?.models ?? [], [brand, brands]);

  return (
    <form action="/cars" className="grid gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-2xl shadow-black/30 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.25fr_auto]" method="get">
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Kondisi
        <select className="min-h-12 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm normal-case text-white outline-none focus:border-red-500" name="condition" defaultValue="">
          <option value="">Semua kondisi</option>
          <option value="NEW">Mobil baru</option>
          <option value="USED">Mobil bekas</option>
        </select>
      </label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Merek
        <select className="min-h-12 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm normal-case text-white outline-none focus:border-red-500" name="brand" value={brand} onChange={(event) => setBrand(event.target.value)}>
          <option value="">Semua merek</option>
          {brands.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Model
        <select className="min-h-12 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm normal-case text-white outline-none focus:border-red-500 disabled:text-zinc-600" disabled={!brand || models.length === 0} name="model" defaultValue="" key={brand}>
          <option value="">Semua model</option>
          {models.map((model) => <option key={model.slug} value={model.slug}>{model.name}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 sm:col-span-2 lg:col-span-1">
        Kata kunci
        <input className="min-h-12 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm normal-case text-white outline-none placeholder:text-zinc-600 focus:border-red-500" name="q" placeholder="Contoh: Avanza G" type="search" />
      </label>
      <button className="min-h-12 self-end rounded-xl bg-red-600 px-6 text-sm font-bold text-white transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 sm:col-span-2 lg:col-span-1" type="submit">
        Cari Mobil
      </button>
    </form>
  );
}
