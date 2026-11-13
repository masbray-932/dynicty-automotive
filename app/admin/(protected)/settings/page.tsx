import { connection } from "next/server";
import { DealerSettingsForm } from "@/features/settings/dealer-settings-form";
import { getAdminDealerSettings } from "@/server/settings/service";
import { requireAdmin } from "@/server/auth/session";
import { AdminFormGuard } from "@/components/admin/admin-form-guard";
import { AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminSettingsPage() {
  await requireAdmin();
  await connection();
  const result = await getAdminDealerSettings();
  if (result.kind === "error") return <section><h1 className="text-3xl font-bold text-white">Pengaturan Dealer</h1><div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6"><h2 className="font-bold text-white">Pengaturan tidak dapat dimuat</h2><p className="mt-2 text-sm text-zinc-300">Silakan coba kembali beberapa saat lagi.</p></div></section>;
  const settings = result.settings;
  const values = {
    dealerName: settings?.dealerName ?? null, phone: settings?.phone ?? null, whatsappNumber: settings?.whatsappNumber ?? null,
    whatsappWidgetEnabled: settings?.whatsappWidgetEnabled ?? true, whatsappWidgetMessage: settings?.whatsappWidgetMessage ?? "",
    email: settings?.email ?? null, address: settings?.address ?? null, googleMapsUrl: settings?.googleMapsUrl ?? null,
    instagramUrl: settings?.instagramUrl ?? null, facebookUrl: settings?.facebookUrl ?? null,
  };
  return <section className="mx-auto grid max-w-5xl gap-6"><AdminPageHeader eyebrow="Konfigurasi dealer" title="Pengaturan Dealer" description="Kelola identitas, branding, kontak, lokasi, dan media sosial yang digunakan website publik." /><AdminFormGuard><DealerSettingsForm branding={{ primaryColor: settings?.primaryColor ?? null, secondaryColor: settings?.secondaryColor ?? null }} faviconUrl={result.faviconUrl} logoUrl={result.logoUrl} values={values} /></AdminFormGuard></section>;
}
