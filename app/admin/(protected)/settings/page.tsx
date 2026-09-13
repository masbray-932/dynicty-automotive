import { connection } from "next/server";
import { DealerSettingsForm } from "@/features/settings/dealer-settings-form";
import { getAdminDealerSettings } from "@/server/settings/service";

export default async function AdminSettingsPage() {
  await connection();
  const result = await getAdminDealerSettings();
  if (result.kind === "error") return <section><h1 className="text-3xl font-bold text-white">Pengaturan Dealer</h1><div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6"><h2 className="font-bold text-white">Pengaturan tidak dapat dimuat</h2><p className="mt-2 text-sm text-zinc-300">Silakan coba kembali beberapa saat lagi.</p></div></section>;
  const settings = result.settings;
  const values = {
    dealerName: settings?.dealerName ?? null, phone: settings?.phone ?? null, whatsappNumber: settings?.whatsappNumber ?? null,
    email: settings?.email ?? null, address: settings?.address ?? null, googleMapsUrl: settings?.googleMapsUrl ?? null,
    instagramUrl: settings?.instagramUrl ?? null, facebookUrl: settings?.facebookUrl ?? null,
    primaryColor: settings?.primaryColor ?? null, secondaryColor: settings?.secondaryColor ?? null,
  };
  return <section><div className="mb-7"><h1 className="text-3xl font-bold text-white">Pengaturan Dealer</h1><p className="mt-2 max-w-2xl text-zinc-400">Kelola identitas, kontak, logo, lokasi, media sosial, dan warna dasar yang digunakan website publik.</p></div><DealerSettingsForm logoUrl={result.logoUrl} values={values} /></section>;
}
