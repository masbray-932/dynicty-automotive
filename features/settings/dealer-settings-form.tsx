"use client";
import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { emptyActionState } from "@/types/action-state";
import { removeDealerLogoAction, saveDealerSettingsAction, uploadDealerLogoAction } from "@/server/settings/actions";

type Values = Record<string, string | null>;
const inputClass = "min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 text-white outline-none focus:border-red-500";

function ErrorText({ value }: { value?: string[] }) { return value?.[0] ? <p className="mt-1 text-xs text-red-300">{value[0]}</p> : null; }

export function DealerSettingsForm({ values, logoUrl }: { values: Values; logoUrl: string | null }) {
  const [state, action, pending] = useActionState(saveDealerSettingsAction, emptyActionState);
  const [logoState, logoAction, logoPending] = useActionState(uploadDealerLogoAction, emptyActionState);
  const [removeState, removeAction, removePending] = useActionState(removeDealerLogoAction, emptyActionState);
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6"><h2 className="text-xl font-bold text-white">Logo Dealer</h2><div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">{logoUrl ? <Image alt="Logo dealer saat ini" className="h-28 w-28 rounded-xl border border-white/10 bg-white object-contain p-2" height={112} src={logoUrl} unoptimized={logoUrl.startsWith("http")} width={112} /> : <div className="grid h-28 w-28 place-items-center rounded-xl border border-dashed border-white/20 text-sm text-zinc-500">Belum ada logo</div>}<div className="flex-1"><form action={logoAction} className="grid gap-3"><label className="text-sm font-semibold text-zinc-200" htmlFor="dealer-logo">Unggah logo PNG, JPEG, atau WEBP</label><input accept="image/jpeg,image/png,image/webp" className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-black" id="dealer-logo" name="logo" required type="file" /><p className="text-xs text-zinc-500">Maksimal 4 MB. Isi file diperiksa, bukan hanya nama file.</p><ErrorText value={logoState.errors.logo} /><Button disabled={logoPending} type="submit">{logoPending ? "Mengunggah…" : logoUrl ? "Ganti Logo" : "Unggah Logo"}</Button>{logoState.message ? <p aria-live="polite" className="text-sm text-zinc-300">{logoState.message}</p> : null}</form>{logoUrl ? <form action={removeAction} className="mt-3"><Button disabled={removePending} type="submit" variant="danger">Hapus Logo</Button>{removeState.message ? <p aria-live="polite" className="mt-2 text-sm text-zinc-300">{removeState.message}</p> : null}</form> : null}</div></div></section>

      <form action={action} className="grid gap-6">
        <SettingsSection title="Identitas Dealer"><Field error={state.errors.dealerName} label="Nama dealer"><input className={inputClass} defaultValue={values.dealerName ?? "Dynicty Automotive"} name="dealerName" required /></Field></SettingsSection>
        <SettingsSection title="Kontak"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.phone} label="Nomor telepon"><input className={inputClass} defaultValue={values.phone ?? ""} name="phone" placeholder="021 1234 5678" /></Field><Field error={state.errors.whatsappNumber} label="Nomor WhatsApp"><input className={inputClass} defaultValue={values.whatsappNumber ?? ""} name="whatsappNumber" placeholder="081234567890" /></Field><Field error={state.errors.email} label="Email"><input className={inputClass} defaultValue={values.email ?? ""} name="email" type="email" /></Field></div></SettingsSection>
        <SettingsSection title="Lokasi"><Field error={state.errors.address} label="Alamat"><textarea className={`${inputClass} min-h-28 py-3`} defaultValue={values.address ?? ""} name="address" /></Field><Field error={state.errors.googleMapsUrl} label="Tautan Google Maps"><input className={inputClass} defaultValue={values.googleMapsUrl ?? ""} name="googleMapsUrl" placeholder="https://maps.google.com/..." type="url" /></Field></SettingsSection>
        <SettingsSection title="Media Sosial"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.instagramUrl} label="Instagram URL"><input className={inputClass} defaultValue={values.instagramUrl ?? ""} name="instagramUrl" type="url" /></Field><Field error={state.errors.facebookUrl} label="Facebook URL"><input className={inputClass} defaultValue={values.facebookUrl ?? ""} name="facebookUrl" type="url" /></Field></div></SettingsSection>
        <SettingsSection title="Branding"><div className="grid gap-4 sm:grid-cols-2"><Field error={state.errors.primaryColor} label="Warna utama"><input aria-label="Pilih warna utama" className="h-12 w-full rounded-lg border border-white/15 bg-zinc-950 p-1" defaultValue={values.primaryColor ?? "#DC2626"} name="primaryColor" type="color" /></Field><Field error={state.errors.secondaryColor} label="Warna sekunder"><input aria-label="Pilih warna sekunder" className="h-12 w-full rounded-lg border border-white/15 bg-zinc-950 p-1" defaultValue={values.secondaryColor ?? "#18181B"} name="secondaryColor" type="color" /></Field></div><p className="text-xs text-zinc-500">Hanya nilai hex 6 digit yang diterima. Token publik memakai fallback merah/gelap.</p></SettingsSection>
        <Button className="sm:w-fit" disabled={pending} type="submit">{pending ? "Menyimpan…" : "Simpan Pengaturan"}</Button>{state.message ? <p aria-live="polite" className="rounded-xl border border-white/10 p-4 text-sm text-zinc-200">{state.message}</p> : null}
      </form>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6"><h2 className="text-xl font-bold text-white">{title}</h2>{children}</section>; }
function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-semibold text-zinc-200">{label}{children}<ErrorText value={error} /></label>; }
