"use client";
import Image from "next/image";
import { useState } from "react";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { settingsConfirmation, criticalAction } from "@/features/admin/confirmation-policy";
import { ActionNotification } from "@/components/ui/action-notification";
import { useFeedbackAction } from "@/features/forms/use-feedback-action";
import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types/action-state";
import { removeDealerLogoAction, saveDealerSettingsAction, uploadDealerLogoAction } from "@/server/settings/actions";

type Values = Record<string, string | null>;
const inputClass = "min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 text-white outline-none focus:border-brand-focus";

export function DealerSettingsForm({ values, logoUrl }: { values: Values; logoUrl: string | null }) {
  const [notice, setNotice] = useState<ActionState | null>(null);
  const [draft, setDraft] = useState<Values>(() => ({ ...values, dealerName: values.dealerName ?? "Dynicty Automotive", primaryColor: values.primaryColor ?? "#DC2626", secondaryColor: values.secondaryColor ?? "#18181B" }));
  const control = (name: string) => ({
    value: draft[name] ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      if (name === "address") event.target.setCustomValidity(value.trim() ? "" : "Alamat showroom wajib diisi.");
      setDraft(previous => ({ ...previous, [name]: value }));
    },
  });
  const [state, action, pending] = useFeedbackAction(saveDealerSettingsAction, setNotice);
  const [logoState, logoAction, logoPending] = useFeedbackAction(uploadDealerLogoAction, setNotice);
  const [, removeAction, removePending] = useFeedbackAction(removeDealerLogoAction, setNotice);
  return (
    <div className="grid gap-6">
      <ActionNotification key={notice?.resultId} state={notice} />
      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6"><h2 className="text-xl font-bold text-white">Logo Dealer</h2><div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">{logoUrl ? <Image alt="Logo dealer saat ini" className="h-28 w-28 rounded-xl border border-white/10 bg-white object-contain p-2" height={112} src={logoUrl} unoptimized={shouldBypassImageOptimization(logoUrl)} width={112} /> : <div className="grid h-28 w-28 place-items-center rounded-xl border border-dashed border-white/20 text-sm text-zinc-500">Belum ada logo</div>}<div className="flex-1"><ConfirmationForm confirmation={() => logoUrl ? criticalAction("Ganti logo dealer?", "Logo baru menggantikan identitas visual dealer di website publik.", "Ganti logo") : null} action={logoAction} className="grid gap-3"><FormField error={logoState.errors.logo?.[0]} htmlFor="dealer-logo" label="Unggah logo PNG, JPEG, atau WEBP"><input accept="image/jpeg,image/png,image/webp" className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-black" name="logo" required type="file" /></FormField><p className="text-xs text-zinc-500">Maksimal 4 MB. Isi file diperiksa, bukan hanya nama file.</p><Button disabled={logoPending} type="submit">{logoPending ? "Mengunggah…" : logoUrl ? "Ganti Logo" : "Unggah Logo"}</Button></ConfirmationForm>{logoUrl ? <ConfirmationForm confirmation={() => criticalAction("Hapus logo dealer?", "Website akan menggunakan identitas pengganti sampai logo baru diunggah.", "Hapus logo", true)} action={removeAction} className="mt-3"><Button disabled={removePending} type="submit" variant="danger">Hapus Logo</Button></ConfirmationForm> : null}</div></div></section>

      <ConfirmationForm confirmation={data => settingsConfirmation(values, data)} action={action} onSubmit={event => {
        const address = event.currentTarget.elements.namedItem("address") as HTMLTextAreaElement;
        address.setCustomValidity(address.value.trim() ? "" : "Alamat showroom wajib diisi.");
        if (!address.reportValidity()) event.preventDefault();
      }} className="grid gap-6">
        <SettingsSection title="Identitas Dealer"><Field error={state.errors.dealerName} htmlFor="dealerName" label="Nama dealer"><input className={inputClass} {...control("dealerName")} name="dealerName" required /></Field></SettingsSection>
        <SettingsSection title="Kontak"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.phone} htmlFor="phone" label="Nomor telepon"><input className={inputClass} {...control("phone")} name="phone" placeholder="021 1234 5678" /></Field><Field error={state.errors.whatsappNumber} htmlFor="whatsappNumber" label="Nomor WhatsApp"><input className={inputClass} {...control("whatsappNumber")} name="whatsappNumber" placeholder="081234567890" /></Field><Field error={state.errors.email} htmlFor="email" label="Email"><input className={inputClass} {...control("email")} name="email" type="email" /></Field></div></SettingsSection>
        <SettingsSection title="Lokasi"><Field error={state.errors.address} htmlFor="address" label="Alamat"><textarea className={`${inputClass} min-h-28 py-3`} {...control("address")} name="address" required /></Field><Field error={state.errors.googleMapsUrl} htmlFor="googleMapsUrl" label="Tautan Google Maps"><input className={inputClass} {...control("googleMapsUrl")} name="googleMapsUrl" placeholder="https://maps.google.com/..." type="url" /></Field></SettingsSection>
        <SettingsSection title="Media Sosial"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.instagramUrl} htmlFor="instagramUrl" label="Instagram URL"><input className={inputClass} {...control("instagramUrl")} name="instagramUrl" type="url" /></Field><Field error={state.errors.facebookUrl} htmlFor="facebookUrl" label="Facebook URL"><input className={inputClass} {...control("facebookUrl")} name="facebookUrl" type="url" /></Field></div></SettingsSection>
        <SettingsSection title="Branding"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.primaryColor} htmlFor="primaryColor" label="Warna utama"><input aria-label="Pilih warna utama" className="h-12 w-full rounded-lg border border-white/15 bg-zinc-950 p-1" {...control("primaryColor")} name="primaryColor" type="color" /></Field><Field error={state.errors.secondaryColor} htmlFor="secondaryColor" label="Warna sekunder"><input aria-label="Pilih warna sekunder" className="h-12 w-full rounded-lg border border-white/15 bg-zinc-950 p-1" {...control("secondaryColor")} name="secondaryColor" type="color" /></Field></div><p className="text-xs text-zinc-500">Hanya nilai hex 6 digit yang diterima. Tombol utama otomatis memakai warna teks yang tetap terbaca.</p></SettingsSection>
        <Button className="sm:w-fit" disabled={pending} type="submit">{pending ? "Menyimpan…" : "Simpan Pengaturan"}</Button>
      </ConfirmationForm>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6"><h2 className="text-xl font-bold text-white">{title}</h2>{children}</section>; }
function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string[]; children: React.ReactNode }) { return <FormField error={error?.[0]} htmlFor={htmlFor} label={label}>{children}</FormField>; }
