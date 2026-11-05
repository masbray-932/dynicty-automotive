"use client";
import Image from "next/image";
import { useState } from "react";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { settingsConfirmation } from "@/features/admin/confirmation-policy";
import { ActionNotification } from "@/components/ui/action-notification";
import { useFeedbackAction } from "@/features/forms/use-feedback-action";
import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type { ActionState } from "@/types/action-state";
import type { DealerSettingsValues } from "@/validation/dealer-settings";
import { saveDealerSettingsAction } from "@/server/settings/actions";

type Values = Record<keyof DealerSettingsValues, string | null>;
const inputClass = "min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 text-white outline-none focus:border-brand-focus";

export function DealerSettingsForm({ values, logoUrl }: { values: Values; logoUrl: string | null }) {
  const [notice, setNotice] = useState<ActionState | null>(null);
  const [draft, setDraft] = useState<Values>(() => ({ ...values, dealerName: values.dealerName ?? "Dynicty Automotive" }));
  const control = (name: keyof Values) => ({
    value: draft[name] ?? "",
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
      <SettingsSection title="Branding Dealer">
        <div className="flex flex-wrap items-center gap-4">
          {logoUrl ? (
            <Image alt="Logo dealer saat ini" className="h-28 w-28 rounded-xl border border-white/10 bg-white object-contain p-2" height={112} src={logoUrl} unoptimized={shouldBypassImageOptimization(logoUrl)} width={112} />
          ) : <p className="text-sm text-zinc-400">Belum ada logo.</p>}
          <p className="text-sm text-zinc-300">Warna dan logo dealer dikelola oleh platform.</p>
        </div>
      </SettingsSection>

      <ConfirmationForm confirmation={data => settingsConfirmation(values, data)} action={action} onSubmit={event => {
        const address = event.currentTarget.elements.namedItem("address") as HTMLTextAreaElement;
        address.setCustomValidity(address.value.trim() ? "" : "Alamat showroom wajib diisi.");
        if (!address.reportValidity()) event.preventDefault();
      }} className="grid gap-6">
        <SettingsSection title="Identitas Dealer"><Field error={state.errors.dealerName} htmlFor="dealerName" label="Nama dealer"><input className={inputClass} {...control("dealerName")} name="dealerName" required /></Field></SettingsSection>
        <SettingsSection title="Kontak"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.phone} htmlFor="phone" label="Nomor telepon"><input className={inputClass} {...control("phone")} name="phone" placeholder="021 1234 5678" /></Field><Field error={state.errors.whatsappNumber} htmlFor="whatsappNumber" label="Nomor WhatsApp"><input className={inputClass} {...control("whatsappNumber")} name="whatsappNumber" placeholder="081234567890" /></Field><Field error={state.errors.email} htmlFor="email" label="Email"><input className={inputClass} {...control("email")} name="email" type="email" /></Field></div></SettingsSection>
        <SettingsSection title="Lokasi"><Field error={state.errors.address} htmlFor="address" label="Alamat"><textarea className={`${inputClass} min-h-28 py-3`} {...control("address")} name="address" required /></Field><Field error={state.errors.googleMapsUrl} htmlFor="googleMapsUrl" label="Tautan Google Maps"><input className={inputClass} {...control("googleMapsUrl")} name="googleMapsUrl" placeholder="https://maps.google.com/..." type="url" /></Field></SettingsSection>
        <SettingsSection title="Media Sosial"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.instagramUrl} htmlFor="instagramUrl" label="Instagram URL"><input className={inputClass} {...control("instagramUrl")} name="instagramUrl" type="url" /></Field><Field error={state.errors.facebookUrl} htmlFor="facebookUrl" label="Facebook URL"><input className={inputClass} {...control("facebookUrl")} name="facebookUrl" type="url" /></Field></div></SettingsSection>
        <Button className="sm:w-fit" disabled={pending} type="submit">{pending ? "Menyimpan…" : "Simpan Pengaturan"}</Button>
      </ConfirmationForm>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6"><h2 className="text-xl font-bold text-white">{title}</h2>{children}</section>; }
function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string[]; children: React.ReactNode }) { return <FormField error={error?.[0]} htmlFor={htmlFor} label={label}>{children}</FormField>; }
