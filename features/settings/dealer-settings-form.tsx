"use client";
import Image from "next/image";
import { useState } from "react";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { criticalAction, settingsConfirmation } from "@/features/admin/confirmation-policy";
import { ActionNotification } from "@/components/ui/action-notification";
import { useFeedbackAction } from "@/features/forms/use-feedback-action";
import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types/action-state";
import type { DealerSettingsValues } from "@/validation/dealer-settings";
import { removeStandaloneFaviconAction, removeStandaloneLogoAction, replaceStandaloneFaviconAction, replaceStandaloneLogoAction, saveDealerSettingsAction, saveStandaloneColorsAction } from "@/server/settings/actions";
import { normalizeThemeColor } from "@/features/theme/domain";

type Values = { [K in keyof DealerSettingsValues]?: DealerSettingsValues[K] | null };
type TextSetting = Exclude<keyof Values, "whatsappWidgetEnabled">;
const inputClass = "min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 text-white outline-none focus:border-brand-focus";

type BrandingValues = { primaryColor: string | null; secondaryColor: string | null };
export function DealerSettingsForm({ values, logoUrl, faviconUrl = null, branding }: { values: Values; logoUrl: string | null; faviconUrl?: string | null; branding: BrandingValues }) {
  const [notice, setNotice] = useState<ActionState | null>(null);
  const [draft, setDraft] = useState<Values>(() => ({ ...values, dealerName: values.dealerName ?? "Dynicty Automotive" }));
  const control = (name: TextSetting) => ({
    value: String(draft[name] ?? ""),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      if (name === "address") event.target.setCustomValidity(value.trim() ? "" : "Alamat showroom wajib diisi.");
      setDraft(previous => ({ ...previous, [name]: value }));
    },
  });
  const [state, action, pending] = useFeedbackAction(saveDealerSettingsAction, setNotice);
  return (
    <div className="grid gap-6">
      <ActionNotification key={notice?.resultId} state={notice} />
      <BrandingForms key={JSON.stringify(branding)} colors={branding} logoUrl={logoUrl} faviconUrl={faviconUrl} onResult={setNotice} />

      <ConfirmationForm confirmation={data => settingsConfirmation(values, data)} action={action} onSubmit={event => {
        const address = event.currentTarget.elements.namedItem("address") as HTMLTextAreaElement;
        address.setCustomValidity(address.value.trim() ? "" : "Alamat showroom wajib diisi.");
        if (!address.reportValidity()) event.preventDefault();
      }} className="grid gap-6">
        <SettingsSection title="Identitas Dealer"><Field error={state.errors.dealerName} htmlFor="dealerName" label="Nama dealer"><input className={inputClass} {...control("dealerName")} name="dealerName" required /></Field></SettingsSection>
        <SettingsSection title="Kontak"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.phone} htmlFor="phone" label="Nomor telepon"><input className={inputClass} {...control("phone")} name="phone" placeholder="021 1234 5678" /></Field><Field error={state.errors.whatsappNumber} htmlFor="whatsappNumber" label="Nomor WhatsApp"><input className={inputClass} {...control("whatsappNumber")} name="whatsappNumber" placeholder="081234567890" /></Field><Field error={state.errors.email} htmlFor="email" label="Email"><input className={inputClass} {...control("email")} name="email" type="email" /></Field></div><div className="grid gap-4 rounded-xl border border-white/10 p-4"><label className="flex min-h-11 items-center gap-3 text-sm text-zinc-200"><input defaultChecked={values.whatsappWidgetEnabled ?? true} name="whatsappWidgetEnabled" type="checkbox" /> Tampilkan tombol WhatsApp melayang</label><Field error={state.errors.whatsappWidgetMessage} htmlFor="whatsappWidgetMessage" label="Pesan pembuka widget (opsional)"><textarea className={`${inputClass} min-h-24 py-3`} {...control("whatsappWidgetMessage")} maxLength={500} name="whatsappWidgetMessage" placeholder="Halo, saya ingin bertanya tentang kendaraan yang tersedia." /></Field><p className="text-xs text-zinc-400">Widget hanya tampil bila nomor WhatsApp valid.</p></div></SettingsSection>
        <SettingsSection title="Lokasi"><Field error={state.errors.address} htmlFor="address" label="Alamat"><textarea className={`${inputClass} min-h-28 py-3`} {...control("address")} name="address" required /></Field><Field error={state.errors.googleMapsUrl} htmlFor="googleMapsUrl" label="Tautan Google Maps"><input className={inputClass} {...control("googleMapsUrl")} name="googleMapsUrl" placeholder="https://maps.google.com/..." type="url" /></Field></SettingsSection>
        <SettingsSection title="Media Sosial"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.instagramUrl} htmlFor="instagramUrl" label="Instagram URL"><input className={inputClass} {...control("instagramUrl")} name="instagramUrl" type="url" /></Field><Field error={state.errors.facebookUrl} htmlFor="facebookUrl" label="Facebook URL"><input className={inputClass} {...control("facebookUrl")} name="facebookUrl" type="url" /></Field></div></SettingsSection>
        <Button className="sm:w-fit" disabled={pending} type="submit">{pending ? "Menyimpan…" : "Simpan Pengaturan"}</Button>
      </ConfirmationForm>
    </div>
  );
}

function BrandingForms({ colors, logoUrl, faviconUrl, onResult }: { colors: BrandingValues; logoUrl: string | null; faviconUrl: string | null; onResult: (result: ActionState) => void }) {
  const [draft, setDraft] = useState(() => ({
    primaryColor: normalizeThemeColor(colors.primaryColor) ?? "",
    secondaryColor: normalizeThemeColor(colors.secondaryColor) ?? "",
  }));
  const [colorState, colorAction, colorsPending] = useFeedbackAction(saveStandaloneColorsAction, onResult);
  const [logoState, logoAction, logoPending] = useFeedbackAction(replaceStandaloneLogoAction, onResult);
  const [, removeAction, removePending] = useFeedbackAction(removeStandaloneLogoAction, onResult);
  const [faviconState, faviconAction, faviconPending] = useFeedbackAction(replaceStandaloneFaviconAction, onResult);
  const [, removeFaviconAction, removeFaviconPending] = useFeedbackAction(removeStandaloneFaviconAction, onResult);
  const busy = colorsPending || logoPending || removePending || faviconPending || removeFaviconPending;
  return <SettingsSection title="Branding Dealer">
    <p className="text-sm text-zinc-300">Atur logo dan warna website publik. Kosongkan warna untuk memakai pengaturan bawaan.</p>
    <div className="flex flex-wrap items-center gap-4">
      {logoUrl ? <Image alt="Logo dealer saat ini" className="h-28 w-28 rounded-xl border border-white/10 bg-white object-contain p-2" height={112} src={logoUrl} unoptimized={shouldBypassImageOptimization(logoUrl)} width={112} />
        : <p className="text-sm text-zinc-400">Belum ada logo.</p>}
      <ConfirmationForm action={logoAction} confirmation={() => criticalAction(logoUrl ? "Ganti logo dealer?" : "Tampilkan logo dealer?", "Logo ini akan digunakan di website publik.", "Simpan logo")} className="grid flex-1 gap-2">
        <Field error={logoState.errors.logo} htmlFor="dealer-logo" label="File logo (JPEG, PNG, atau WebP)"><input accept="image/jpeg,image/png,image/webp" className={inputClass} id="dealer-logo" name="logo" required type="file" /></Field>
        <Button className="w-fit" disabled={busy} type="submit">{logoUrl ? "Ganti Logo" : "Unggah Logo"}</Button>
      </ConfirmationForm>
      {logoUrl ? <ConfirmationForm action={removeAction} confirmation={() => criticalAction("Hapus logo dealer?", "Website akan menampilkan logo bawaan.", "Hapus logo", true)}>
        <Button disabled={busy} type="submit" variant="danger">Hapus Logo</Button>
      </ConfirmationForm> : null}
    </div>
    <div className="grid gap-4 rounded-xl border border-white/10 p-4 sm:grid-cols-[6rem_1fr] sm:items-center">
      <div>{faviconUrl ? <Image alt="Favicon dealer saat ini" className="h-20 w-20 rounded-xl border border-white/10 bg-white object-contain p-2" height={80} src={faviconUrl} unoptimized={shouldBypassImageOptimization(faviconUrl)} width={80} /> : <div className="grid h-20 w-20 place-items-center rounded-xl border border-dashed border-white/15 text-center text-xs text-zinc-500">Favicon bawaan</div>}</div>
      <div className="grid gap-3"><p className="text-sm text-zinc-300">Favicon tampil pada tab browser. File aman akan diproses menjadi WebP 192×192.</p><ConfirmationForm action={faviconAction} confirmation={() => criticalAction(faviconUrl ? "Ganti favicon dealer?" : "Unggah favicon dealer?", "Favicon baru akan digunakan oleh halaman publik.", "Simpan favicon")} className="grid gap-2"><Field error={faviconState.errors.favicon} htmlFor="dealer-favicon" label="File favicon (JPEG, PNG, atau WebP)"><input accept="image/jpeg,image/png,image/webp" className={inputClass} id="dealer-favicon" name="favicon" required type="file" /></Field><Button className="w-fit" disabled={busy} type="submit">{faviconUrl ? "Ganti Favicon" : "Unggah Favicon"}</Button></ConfirmationForm>{faviconUrl ? <ConfirmationForm action={removeFaviconAction} confirmation={() => criticalAction("Hapus favicon dealer?", "Website akan kembali memakai favicon platform.", "Hapus favicon", true)}><Button disabled={busy} type="submit" variant="danger">Hapus Favicon</Button></ConfirmationForm> : null}</div>
    </div>
    <ConfirmationForm action={colorAction} confirmation={() => criticalAction("Simpan warna dealer?", "Warna baru akan digunakan di website publik.", "Simpan warna")} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {([["primaryColor", "Warna utama"], ["secondaryColor", "Warna sekunder (indikator fokus)"]] as const).map(([name, label]) =>
          <Field error={colorState.errors[name]} htmlFor={name} key={name} label={label}>
            <input className={inputClass} id={name} name={name} onChange={event => setDraft(previous => ({ ...previous, [name]: event.target.value }))} pattern="#[0-9a-fA-F]{6}" placeholder="#RRGGBB" value={draft[name]} />
          </Field>)}
      </div>
      <Button className="w-fit" disabled={busy} type="submit">Simpan Warna</Button>
    </ConfirmationForm>
  </SettingsSection>;
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6"><h2 className="text-xl font-bold text-white">{title}</h2>{children}</section>; }
function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string[]; children: React.ReactNode }) { return <FormField error={error?.[0]} htmlFor={htmlFor} label={label}>{children}</FormField>; }
