"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { criticalAction } from "@/features/admin/confirmation-policy";
import { useFeedbackAction } from "@/features/forms/use-feedback-action";
import { useCmsFeedback } from "./cms-feedback";
import { deleteEditorialAction, saveEditorialAction } from "@/server/editorial/actions";
import type { EditorialKind } from "@/validation/editorial";

export type EditorialDraft = Record<string, string | boolean>;
const controlClass = "min-h-11 w-full rounded-xl border border-white/20 bg-zinc-950 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-brand-focus";
export function EditorialEditor({ kind, initial, categories = [], imageUrl }: { kind: EditorialKind; initial?: EditorialDraft; imageUrl?: string | null; categories?: Array<{ id: string; name: string; active: boolean }> }) {
  const notify = useCmsFeedback();
  const [state, action, pending] = useFeedbackAction(saveEditorialAction.bind(null, kind), notify);
  const [, removeAction, deleting] = useFeedbackAction(deleteEditorialAction.bind(null, kind), notify);
  const prefix = useId();
  const [draft, setDraft] = useState<EditorialDraft>(() => ({ id: "", name: "", title: "", slug: "", description: "", shortDescription: "", excerpt: "", body: "", categoryId: "", status: "DRAFT", imageAlt: "", sortOrder: "0", active: false, homepageVisible: false, ...initial }));
  const text = (name: string) => String(draft[name] ?? "");
  const update = (name: string, value: string | boolean) => setDraft(previous => ({ ...previous, [name]: value }));
  function field(name: string, label: string, multiline = false, max = 200) {
    const props = { name, value: text(name), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(name, event.target.value), maxLength: max };
    return <FormField error={state.errors[name]?.[0]} htmlFor={`${prefix}-${name}`} label={label}>{multiline ? <textarea {...props} className={`${controlClass} min-h-28`} /> : <Input {...props} />}</FormField>;
  }
  const labels = { category: "kategori", service: "layanan", article: "artikel" };
  return <article className="grid gap-5 rounded-2xl border border-white/15 bg-zinc-900 p-5">
    <h3 className="text-xl font-semibold">{initial?.id ? `Edit ${labels[kind]}: ${initial.title ?? initial.name}` : `Tambah ${labels[kind]}`}</h3>
    <ConfirmationForm className="grid gap-4" action={action} confirmation={() => initial?.id || draft.status === "PUBLISHED" || draft.active ? criticalAction("Simpan perubahan konten?", "Perubahan publikasi, kategori, identitas atau media dapat memengaruhi website publik.", "Simpan konten") : null}>
      <input type="hidden" name="id" value={text("id")} />
      {field(kind === "category" ? "name" : "title", kind === "category" ? "Nama kategori" : "Judul")}
      {field("slug", "Slug — huruf kecil dan tanda hubung", false, 120)}
      {kind === "category" ? field("description", "Deskripsi kategori", true, 2000) : <>
        {kind === "service" ? <FormField error={state.errors.categoryId?.[0]} htmlFor={`${prefix}-category`} label="Kategori layanan"><select className={controlClass} name="categoryId" value={text("categoryId")} onChange={event => update("categoryId", event.target.value)}><option value="">Pilih kategori</option>{categories.map(category => <option value={category.id} key={category.id}>{category.name}{category.active ? "" : " (nonaktif)"}</option>)}</select></FormField> : null}
        {field(kind === "service" ? "shortDescription" : "excerpt", kind === "service" ? "Ringkasan layanan" : "Cuplikan artikel", true, 1500)}
        {field("body", kind === "service" ? "Deskripsi lengkap" : "Isi artikel — teks biasa, bukan HTML", true, 30000)}
        {field("imageAlt", "Deskripsi gambar", false, 200)}
        <FormField error={state.errors.image?.[0]} htmlFor={`${prefix}-image`} label="Gambar opsional — JPEG/PNG/WebP, maksimal 8 MiB / 25 megapiksel"><input className={controlClass} name="image" type="file" accept="image/jpeg,image/png,image/webp" /></FormField>
        {imageUrl ? <Image src={imageUrl} alt={text("imageAlt")} width={480} height={270} unoptimized className="max-h-64 w-full rounded-xl object-contain" /> : null}
        {initial?.hasImage ? <label><input name="removeImage" type="checkbox" checked={Boolean(draft.removeImage)} onChange={event => update("removeImage", event.target.checked)} /> Hapus gambar tersimpan (upload baru menggantikan gambar lama)</label> : null}
        <FormField error={state.errors.status?.[0]} htmlFor={`${prefix}-status`} label="Publikasi"><select className={controlClass} name="status" value={text("status")} onChange={event => update("status", event.target.value)}><option value="DRAFT">Draft</option><option value="PUBLISHED">Terbit</option></select></FormField>
      </>}
      {kind !== "article" ? <FormField error={state.errors.sortOrder?.[0]} htmlFor={`${prefix}-order`} label="Urutan"><Input name="sortOrder" type="number" min={0} max={999} value={text("sortOrder")} onChange={event => update("sortOrder", event.target.value)} /></FormField> : null}
      {kind === "category" ? <label><input name="active" type="checkbox" checked={Boolean(draft.active)} onChange={event => update("active", event.target.checked)} /> Kategori aktif (kategori nonaktif menyembunyikan layanan publik)</label> : null}
      {kind === "service" ? <label><input name="homepageVisible" type="checkbox" checked={Boolean(draft.homepageVisible)} onChange={event => update("homepageVisible", event.target.checked)} /> Tampilkan di Homepage setelah terbit</label> : null}
      <Button type="submit" disabled={pending || deleting}>{pending ? "Menyimpan…" : "Simpan konten"}</Button>
      {state.message ? <p role="status">{state.message}</p> : null}
    </ConfirmationForm>
    {initial?.id ? <ConfirmationForm action={removeAction} confirmation={() => criticalAction(`Hapus ${labels[kind]}?`, "Konten akan dihapus. Kategori yang masih dipakai tidak dapat dihapus.", "Hapus konten", true)}><input name="id" type="hidden" value={text("id")} /><input name="confirm" type="hidden" value="on" /><Button variant="danger" type="submit" disabled={pending || deleting}>Hapus konten</Button></ConfirmationForm> : null}
  </article>;
}
