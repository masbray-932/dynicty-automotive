"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteImageAction, reorderImageAction, setPrimaryImageAction, uploadImageAction } from "@/server/cars/actions";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { criticalAction } from "@/features/admin/confirmation-policy";
import { emptyActionState } from "@/types/action-state";
import { MediaUploadField } from "@/components/admin/media-upload-field";

type ImageItem = { id: string; url: string; isPrimary: boolean; sortOrder: number };

export function ImageManager({ carId, images }: { carId: string; images: ImageItem[] }) {
  const [state, uploadAction, pending] = useActionState(uploadImageAction.bind(null, carId), emptyActionState);
  return (
    <div className="space-y-6">
      <form action={uploadAction} className="rounded-xl border border-dashed border-white/20 p-4">
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1"><MediaUploadField spec="vehicle" id="image" required className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 p-2 text-sm" error={state.errors.image?.[0]} /></div>
          <Button disabled={pending} type="submit">{pending ? "Mengunggah…" : "Unggah"}</Button>
        </div>
        {state.message ? <p aria-live="polite" className="mt-3 text-sm text-zinc-300">{state.message}</p> : null}
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
                {!image.isPrimary ? <ConfirmationForm action={setPrimaryImageAction} confirmation={() => criticalAction("Ganti gambar utama kendaraan?", `Foto urutan ${index + 1} akan menjadi cover yang ditampilkan kepada pengunjung.`, "Jadikan cover")}><input name="carId" type="hidden" value={carId} /><input name="imageId" type="hidden" value={image.id} /><Button className="min-h-9 px-3 py-1" type="submit" variant="secondary">Jadikan cover</Button></ConfirmationForm> : null}
                {(["up", "down"] as const).map((direction) => <form action={reorderImageAction} key={direction}><input name="carId" type="hidden" value={carId} /><input name="imageId" type="hidden" value={image.id} /><input name="direction" type="hidden" value={direction} /><Button className="min-h-9 px-3 py-1" disabled={direction === "up" ? index === 0 : index === images.length - 1} type="submit" variant="secondary">{direction === "up" ? "Naik" : "Turun"}</Button></form>)}
                <ConfirmationForm action={deleteImageAction} confirmation={() => criticalAction(image.isPrimary ? "Hapus gambar utama?" : "Hapus gambar kendaraan?", image.isPrimary ? "Cover akan dihapus. Gambar lain akan dipilih sebagai cover pengganti bila tersedia." : "Gambar ini akan dihapus dan tidak dapat dipulihkan.", "Hapus gambar", true)}><input name="carId" type="hidden" value={carId} /><input name="imageId" type="hidden" value={image.id} /><Button className="min-h-9 px-3 py-1" type="submit" variant="danger">Hapus</Button></ConfirmationForm>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
