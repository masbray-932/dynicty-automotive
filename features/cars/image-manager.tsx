"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteImageAction, reorderImageAction, setPrimaryImageAction, uploadImageAction } from "@/server/cars/actions";
import { emptyActionState } from "@/types/action-state";

type ImageItem = { id: string; url: string; isPrimary: boolean; sortOrder: number };

export function ImageManager({ carId, images }: { carId: string; images: ImageItem[] }) {
  const [state, uploadAction, pending] = useActionState(uploadImageAction.bind(null, carId), emptyActionState);
  return (
    <div className="space-y-6">
      <form action={uploadAction} className="rounded-xl border border-dashed border-white/20 p-4">
        <label className="block text-sm font-medium text-white" htmlFor="image">Tambah gambar kendaraan</label>
        <p className="mt-1 text-xs text-zinc-400">JPEG, PNG, atau WEBP. Maksimal 8 MB.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input accept="image/jpeg,image/png,image/webp" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 p-2 text-sm" id="image" name="image" required type="file" />
          <Button disabled={pending} type="submit">{pending ? "Mengunggah…" : "Unggah"}</Button>
        </div>
        {state.message ? <p aria-live="polite" className="mt-3 text-sm text-zinc-300">{state.message}</p> : null}
        {state.errors.image?.[0] ? <p className="mt-1 text-sm text-red-300">{state.errors.image[0]}</p> : null}
      </form>

      {images.length === 0 ? <p className="rounded-xl border border-white/10 p-5 text-sm text-zinc-400">Belum ada gambar. Gambar pertama otomatis menjadi cover.</p> : (
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <li className="overflow-hidden rounded-xl border border-white/10 bg-black/30" key={image.id}>
              <div className="relative aspect-[4/3] bg-zinc-950">
                <Image alt={`Foto mobil urutan ${index + 1}`} className="object-cover" fill sizes="(max-width: 768px) 100vw, 33vw" src={image.url} unoptimized />
                {image.isPrimary ? <span className="absolute left-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">Cover</span> : null}
              </div>
              <div className="flex flex-wrap gap-2 p-3">
                {!image.isPrimary ? <form action={setPrimaryImageAction}><input name="carId" type="hidden" value={carId} /><input name="imageId" type="hidden" value={image.id} /><Button className="min-h-9 px-3 py-1" type="submit" variant="secondary">Jadikan cover</Button></form> : null}
                {(["up", "down"] as const).map((direction) => <form action={reorderImageAction} key={direction}><input name="carId" type="hidden" value={carId} /><input name="imageId" type="hidden" value={image.id} /><input name="direction" type="hidden" value={direction} /><Button className="min-h-9 px-3 py-1" disabled={direction === "up" ? index === 0 : index === images.length - 1} type="submit" variant="secondary">{direction === "up" ? "Naik" : "Turun"}</Button></form>)}
                <form action={deleteImageAction} onSubmit={(event) => { if (!window.confirm("Hapus gambar ini?")) event.preventDefault(); }}><input name="carId" type="hidden" value={carId} /><input name="imageId" type="hidden" value={image.id} /><Button className="min-h-9 px-3 py-1" type="submit" variant="danger">Hapus</Button></form>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
