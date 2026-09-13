"use client";

import Image from "next/image";
import { useState } from "react";
import { CAR_PLACEHOLDER_IMAGE } from "./domain";

export type GalleryImage = { id: string; url: string; alt: string };

export function VehicleGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const items = images.length ? images : [{ id: "fallback", url: CAR_PLACEHOLDER_IMAGE, alt: `Placeholder foto ${title}` }];
  const [activeId, setActiveId] = useState(items[0].id);
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId));
  const active = items[activeIndex];
  const select = (index: number) => setActiveId(items[(index + items.length) % items.length].id);
  return (
    <section aria-label="Galeri kendaraan">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <Image alt={active.alt} className="object-cover" fill priority sizes="(max-width: 1024px) 100vw, 66vw" src={active.url} unoptimized={!active.url.startsWith("/")} />
        {items.length > 1 ? <><button aria-label="Foto sebelumnya" className="absolute left-3 top-1/2 grid min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-full bg-black/75 text-xl text-white focus-visible:outline-2 focus-visible:outline-white" onClick={() => select(activeIndex - 1)} type="button">‹</button><button aria-label="Foto berikutnya" className="absolute right-3 top-1/2 grid min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-full bg-black/75 text-xl text-white focus-visible:outline-2 focus-visible:outline-white" onClick={() => select(activeIndex + 1)} type="button">›</button></> : null}
      </div>
      {items.length > 1 ? <div className="mt-3 flex gap-3 overflow-x-auto pb-2">{items.map((image, index) => <button aria-label={`Pilih foto ${index + 1} dari ${items.length}`} aria-pressed={image.id === active.id} className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl border-2 ${image.id === active.id ? "border-red-500" : "border-transparent"}`} key={image.id} onClick={() => setActiveId(image.id)} type="button"><Image alt="" className="object-cover" fill sizes="96px" src={image.url} unoptimized={!image.url.startsWith("/")} /></button>)}</div> : null}
    </section>
  );
}
