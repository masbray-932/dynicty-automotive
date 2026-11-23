"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { arrangeUploadedImagesAction, deleteImageAction, reorderImageAction, setPrimaryImageAction, uploadQueuedImageAction } from "@/server/cars/actions";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { criticalAction } from "@/features/admin/confirmation-policy";
import { mediaUploadSpecs } from "@/features/media/upload-specs";
import { hasUnsavedUploads, pendingUploadIds, reorderUploadQueue, successfulUploadIds, uploadFileFingerprint, type UploadQueueItem } from "./image-upload-queue";

type ImageItem = { id: string; url: string; isPrimary: boolean; sortOrder: number };
type LocalUpload = UploadQueueItem & { previewUrl: string };
const spec = mediaUploadSpecs.vehicle;
const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;

export function ImageManager({ carId, images }: { carId: string; images: ImageItem[] }) {
  const router = useRouter();
  const [queue, setQueue] = useState<LocalUpload[]>([]);
  const [primaryQueueId, setPrimaryQueueId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [batchMessage, setBatchMessage] = useState("");
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const previewUrls = useRef(new Set<string>());
  const dirty = hasUnsavedUploads(queue);

  useEffect(() => () => { for (const url of previewUrls.current) URL.revokeObjectURL(url); }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const intercept = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!element || element.dataset.unsavedBypass === "true" || element.target === "_blank" || element.hasAttribute("download")) return;
      event.preventDefault();
      setLeaveHref(element.href);
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", intercept);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", intercept); };
  }, [dirty]);

  function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setQueue(previous => {
      const known = new Set(previous.map(item => uploadFileFingerprint(item.file)));
      const additions: LocalUpload[] = [];
      for (const file of files) {
        const fingerprint = uploadFileFingerprint(file);
        if (known.has(fingerprint)) continue;
        known.add(fingerprint);
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);
        const error = !spec.acceptedFormats.includes(file.type as never)
          ? "Format gambar tidak didukung."
          : file.size > spec.maxFileSizeBytes ? `Ukuran melebihi ${formatBytes(spec.maxFileSizeBytes)}.` : "";
        additions.push({ id: crypto.randomUUID(), file, previewUrl, status: error ? "error" : "pending", message: error });
      }
      return [...previous, ...additions];
    });
    setBatchMessage("");
  }

  function removeQueued(id: string) {
    if (uploading) return;
    setQueue(previous => {
      const item = previous.find(entry => entry.id === id);
      if (!item || item.status === "success") return previous;
      URL.revokeObjectURL(item.previewUrl);
      previewUrls.current.delete(item.previewUrl);
      return previous.filter(entry => entry.id !== id);
    });
    if (primaryQueueId === id) setPrimaryQueueId(null);
  }

  async function uploadItems(ids: string[]) {
    if (uploading || !ids.length) return;
    setUploading(true);
    setBatchMessage("");
    setProgress({ done: 0, total: ids.length });
    let working = queue;
    let done = 0;
    for (const id of ids) {
      const item = working.find(entry => entry.id === id);
      if (!item || item.status === "success") continue;
      working = working.map(entry => entry.id === id ? { ...entry, status: "uploading", message: "Mengunggah…" } : entry);
      setQueue(working);
      const data = new FormData();
      data.set("image", item.file);
      const result = await uploadQueuedImageAction(carId, data);
      working = working.map(entry => entry.id === id ? result.image
        ? { ...entry, status: "success", message: result.message, serverImageId: result.image.id }
        : { ...entry, status: "error", message: result.errors.image?.[0] ?? result.message }
        : entry);
      setQueue(working);
      done += 1;
      setProgress({ done, total: ids.length });
    }
    const uploadedIds = successfulUploadIds(working);
    if (uploadedIds.length) {
      const arrangement = new FormData();
      arrangement.set("imageIds", JSON.stringify(uploadedIds));
      const selected = working.find(item => item.id === primaryQueueId)?.serverImageId;
      if (selected) arrangement.set("primaryImageId", selected);
      const result = await arrangeUploadedImagesAction(carId, arrangement);
      setBatchMessage(result.message);
    }
    setUploading(false);
    router.refresh();
  }

  const uploadable = pendingUploadIds(queue);
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-dashed border-white/20 p-4" aria-labelledby="queued-images-title">
        <h3 className="font-semibold text-white" id="queued-images-title">Pilih beberapa foto</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-400">Foto baru belum diunggah sampai Anda menekan Upload Semua. JPEG, PNG, atau WebP; maksimum {formatBytes(spec.maxFileSizeBytes)} per file.</p>
        <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-white/15 bg-zinc-900 px-4 text-sm font-bold text-white focus-within:outline-2 focus-within:outline-brand-focus">Tambah foto<input accept={spec.acceptedFormats.join(",")} className="sr-only" multiple onChange={addFiles} type="file" /></label>
        {queue.length ? <ol className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{queue.map((item, index) => <li className="overflow-hidden rounded-xl border border-white/10 bg-black/30" key={item.id}><div className="relative aspect-[4/3] bg-zinc-950"><Image alt={`Preview ${item.file.name}`} className="object-contain" fill sizes="(max-width: 768px) 100vw, 33vw" src={item.previewUrl} unoptimized />{primaryQueueId === item.id ? <span className="absolute left-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">Utama setelah upload</span> : null}</div><div className="grid gap-3 p-3"><div><p className="truncate text-sm font-semibold text-white" title={item.file.name}>{item.file.name}</p><p className="text-xs text-zinc-400">{formatBytes(item.file.size)}</p></div><p aria-live="polite" className={`text-xs ${item.status === "error" ? "text-red-300" : item.status === "success" ? "text-emerald-300" : "text-zinc-300"}`}>{item.message || "Menunggu upload"}</p><div className="flex flex-wrap gap-2"><Button className="min-h-9 px-3 py-1" disabled={uploading || index === 0 || item.status === "success"} onClick={() => setQueue(previous => reorderUploadQueue(previous, item.id, "up"))} type="button" variant="secondary">Naik</Button><Button className="min-h-9 px-3 py-1" disabled={uploading || index === queue.length - 1 || item.status === "success"} onClick={() => setQueue(previous => reorderUploadQueue(previous, item.id, "down"))} type="button" variant="secondary">Turun</Button><Button className="min-h-9 px-3 py-1" disabled={uploading || item.status === "success"} onClick={() => setPrimaryQueueId(current => current === item.id ? null : item.id)} type="button" variant="secondary">{primaryQueueId === item.id ? "Batalkan utama" : "Jadikan utama"}</Button>{item.status === "error" ? <Button className="min-h-9 px-3 py-1" disabled={uploading} onClick={() => uploadItems([item.id])} type="button">Coba lagi</Button> : null}{item.status !== "success" ? <Button className="min-h-9 px-3 py-1" disabled={uploading} onClick={() => removeQueued(item.id)} type="button" variant="danger">Hapus pilihan</Button> : null}</div></div></li>)}</ol> : <p className="mt-5 rounded-lg border border-white/10 p-4 text-sm text-zinc-400">Belum ada foto baru yang dipilih.</p>}
        {queue.length ? <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4"><Button disabled={uploading || uploadable.length === 0} onClick={() => uploadItems(uploadable)} type="button">{uploading ? `Mengunggah ${progress.done}/${progress.total}` : "Upload Semua"}</Button>{progress.total ? <progress aria-label="Progres upload foto" className="h-2 w-48 accent-red-600" max={progress.total} value={progress.done} /> : null}{batchMessage ? <p aria-live="polite" className="text-sm text-zinc-300">{batchMessage}</p> : null}</div> : null}
      </section>

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
      {leaveHref ? <div aria-describedby="unsaved-photos-description" aria-labelledby="unsaved-photos-title" aria-modal="true" className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4" role="dialog"><div className="w-full max-w-md rounded-xl border border-white/15 bg-zinc-950 p-6 shadow-2xl"><h3 className="text-lg font-bold text-white" id="unsaved-photos-title">Foto belum diunggah</h3><p className="mt-2 text-sm leading-6 text-zinc-300" id="unsaved-photos-description">Pilihan foto yang belum berhasil diunggah akan hilang jika Anda meninggalkan halaman ini.</p><div className="mt-5 flex justify-end gap-3"><Button onClick={() => setLeaveHref(null)} type="button" variant="secondary">Tetap di halaman</Button><a className="inline-flex min-h-11 items-center rounded-lg bg-red-600 px-4 font-bold text-white" data-unsaved-bypass="true" href={leaveHref}>Tinggalkan halaman</a></div></div></div> : null}
    </div>
  );
}
