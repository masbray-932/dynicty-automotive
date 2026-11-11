"use client";

import Image from "next/image";
import { useId } from "react";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { criticalAction } from "@/features/admin/confirmation-policy";
import { useCmsFeedback } from "@/features/content/cms-feedback";
import { useFeedbackAction } from "@/features/forms/use-feedback-action";
import { deleteSalesTeamAction, saveSalesTeamAction } from "@/server/sales-team/actions";

export type SalesTeamDraft = { id: string; fullName: string; title: string; whatsappNumber: string | null; biography: string; active: boolean; sortOrder: number; imageUrl: string | null };
const control = "min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 text-white focus-visible:outline-2 focus-visible:outline-brand-focus";

export function SalesTeamEditor({ member }: { member?: SalesTeamDraft }) {
  const notify = useCmsFeedback();
  const [state, action, pending] = useFeedbackAction(saveSalesTeamAction, notify);
  const [, removeAction, deleting] = useFeedbackAction(deleteSalesTeamAction, notify);
  const prefix = useId();
  return <div className="grid gap-5">
    <ConfirmationForm action={action} confirmation={() => member ? criticalAction("Simpan perubahan anggota tim?", "Perubahan status dan kontak dapat memengaruhi website publik.", "Simpan anggota") : null} className="grid gap-4" encType="multipart/form-data">
      {member ? <input name="id" type="hidden" value={member.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2"><FormField error={state.errors.fullName?.[0]} htmlFor={`${prefix}-name`} label="Nama lengkap"><Input defaultValue={member?.fullName} name="fullName" required /></FormField><FormField error={state.errors.title?.[0]} htmlFor={`${prefix}-title`} label="Posisi / jabatan"><Input defaultValue={member?.title} name="title" required /></FormField></div>
      <FormField error={state.errors.whatsappNumber?.[0]} htmlFor={`${prefix}-whatsapp`} label="Nomor WhatsApp"><Input defaultValue={member?.whatsappNumber ?? ""} name="whatsappNumber" placeholder="081234567890" /></FormField>
      <FormField error={state.errors.biography?.[0]} htmlFor={`${prefix}-bio`} label="Biografi singkat"><textarea className={`${control} min-h-28 py-3`} defaultValue={member?.biography} maxLength={1000} name="biography" /></FormField>
      <div className="grid gap-4 sm:grid-cols-2"><FormField error={state.errors.sortOrder?.[0]} htmlFor={`${prefix}-order`} label="Urutan tampil"><Input defaultValue={member?.sortOrder ?? 0} max={999} min={0} name="sortOrder" type="number" /></FormField><label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-white/15 px-4 text-sm"><input defaultChecked={member?.active ?? false} name="active" type="checkbox" />Aktif di website publik</label></div>
      <div className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-[7rem_1fr] sm:items-center">{member?.imageUrl ? <Image alt={`Foto ${member.fullName}`} className="h-28 w-28 rounded-xl object-cover" height={112} src={member.imageUrl} unoptimized width={112} /> : <div className="grid h-28 w-28 place-items-center rounded-xl bg-white/5 text-center text-xs text-zinc-500">Tanpa foto</div>}<div><FormField error={state.errors.image?.[0]} htmlFor={`${prefix}-image`} label={member?.imageUrl ? "Ganti foto" : "Foto profil opsional"}><input accept="image/jpeg,image/png,image/webp" className={control} name="image" type="file" /></FormField>{member?.imageUrl ? <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300"><input name="removeImage" type="checkbox" />Hapus foto tersimpan</label> : null}</div></div>
      <Button className="w-fit" disabled={pending || deleting} type="submit">{pending ? "Menyimpan…" : member ? "Simpan perubahan" : "Tambah anggota"}</Button>
      {state.message ? <p className="text-sm text-zinc-300" role="status">{state.message}</p> : null}
    </ConfirmationForm>
    {member ? <ConfirmationForm action={removeAction} confirmation={() => criticalAction(`Hapus ${member.fullName}?`, "Profil tim akan dihapus dan tidak lagi ditampilkan di website.", "Hapus anggota", true)}><input name="id" type="hidden" value={member.id} /><input name="confirm" type="hidden" value="on" /><Button disabled={pending || deleting} type="submit" variant="danger">Hapus anggota</Button></ConfirmationForm> : null}
  </div>;
}
