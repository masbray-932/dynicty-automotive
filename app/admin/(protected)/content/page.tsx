import { getAdminDealerContent } from "@/server/content/service";
import { requireAdmin } from "@/server/auth/session";
import { ProfileEditor, ItemEditor } from "@/features/content/content-editor";
import { CONTENT_KINDS } from "@/features/content/domain";
const labels = {MAIN_BANNER:"Banner utama",PROMO_BANNER:"Banner promo",ADVANTAGE:"Keunggulan dealer",FAQ:"FAQ",LEASING_PARTNER:"Logo partner leasing"};
export default async function ContentPage() {
  await requireAdmin();
  const {profile,items}=await getAdminDealerContent();
  return <div className="mx-auto grid w-full max-w-5xl gap-8 p-4 sm:p-8"><header><h1 className="text-3xl font-bold">Konten Website</h1><p className="mt-3 text-zinc-400">Isi hanya informasi dealer yang benar. Bagian kosong atau nonaktif tidak ditampilkan. Maksimal 5 banner utama aktif dan 30 item per bagian.</p></header><ProfileEditor key={profile?.updatedAt.toISOString() ?? "empty"} profile={profile} />{CONTENT_KINDS.map(kind=><section key={kind} className="grid gap-4"><h2 className="text-2xl font-bold">{labels[kind]}</h2>{items.filter(item=>item.kind===kind).map(item=><ItemEditor key={`${item.id}-${item.updatedAt.toISOString()}`} kind={kind} item={item} />)}<details className="rounded-xl border border-white/15 p-4"><summary className="min-h-11 cursor-pointer font-semibold">Tambah {labels[kind]}</summary><ItemEditor kind={kind} /></details></section>)}</div>;
}
