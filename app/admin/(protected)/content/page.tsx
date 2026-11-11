import Image from "next/image";
import Link from "next/link";
import { getAdminDealerContent } from "@/server/content/service";
import { requireAdmin } from "@/server/auth/session";
import { DeleteItemForm, ItemEditor, ProfileEditor } from "@/features/content/content-editor";
import { CmsFeedback } from "@/features/content/cms-feedback";
import { isMediaKind, type ContentKind } from "@/features/content/domain";
import { AdminPageHeader } from "@/components/admin/admin-ui";

const sections = [
  { id: "PROFILE", label: "Profil Dealer", description: "Identitas, cerita, showroom, dan jam operasional." },
  { id: "MAIN_BANNER", label: "Banner Utama", description: "Banner sinematik pada bagian teratas beranda." },
  { id: "PROMO_BANNER", label: "Banner Promo", description: "Materi promo informatif tanpa klaim yang menyesatkan." },
  { id: "ADVANTAGE", label: "Keunggulan", description: "Nilai dan keunggulan faktual dealer." },
  { id: "FAQ", label: "FAQ", description: "Pertanyaan dan jawaban yang sering dibutuhkan pelanggan." },
  { id: "LEASING_PARTNER", label: "Partner", description: "Logo partner leasing yang benar-benar berizin." },
  { id: "TESTIMONIAL", label: "Testimoni", description: "Testimoni asli dengan atribusi yang diizinkan." },
] as const;

type SectionId = typeof sections[number]["id"];
type PageQuery = { section?: string | string[]; edit?: string | string[] };

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function selectedSection(value: string | string[] | undefined): SectionId {
  const candidate = first(value);
  return sections.some(section => section.id === candidate) ? candidate as SectionId : "PROFILE";
}
function sectionHref(section: SectionId) { return section === "PROFILE" ? "/admin/content" : `/admin/content?section=${section}`; }
function summary(body: string) {
  const text = body.trim().replace(/\s+/g, " ");
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export default async function ContentPage({ searchParams }: { searchParams?: Promise<PageQuery> }) {
  await requireAdmin();
  const query: PageQuery = await (searchParams ?? Promise.resolve({}));
  const activeSection = selectedSection(query.section);
  const edit = first(query.edit);
  const { profile, showroomUrl, items } = await getAdminDealerContent();
  const section = sections.find(item => item.id === activeSection)!;
  const kind = activeSection === "PROFILE" ? null : activeSection as ContentKind;
  const sectionItems = kind ? items.filter(item => item.kind === kind) : [];
  const editedItem = edit && edit !== "new" ? sectionItems.find(item => item.id === edit) : undefined;
  const editorOpen = Boolean(kind && (edit === "new" || editedItem));
  const baseHref = sectionHref(activeSection);

  return <CmsFeedback><div className="mx-auto grid w-full max-w-6xl gap-6">
    <AdminPageHeader eyebrow="Admin CMS" title="Konten Website" description="Kelola satu bagian pada satu waktu. Konten kosong atau nonaktif tidak ditampilkan di website publik. Maksimal 5 banner utama aktif dan 30 item per bagian." />

    <nav aria-label="Bagian konten website" className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-zinc-950/60 p-2 sm:grid-cols-4 lg:grid-cols-7">
      {sections.map(item => <Link aria-current={item.id === activeSection ? "page" : undefined} className={`flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus ${item.id === activeSection ? "bg-brand-primary text-brand-on-primary" : "text-zinc-300 hover:bg-white/10 hover:text-white"}`} href={sectionHref(item.id)} key={item.id}>{item.label}</Link>)}
    </nav>

    <section aria-labelledby="content-section-title" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
        <div><h2 className="text-2xl font-bold" id="content-section-title">{section.label}</h2><p className="mt-2 text-sm text-zinc-400">{section.description}</p></div>
        {kind && !editorOpen ? <Link className="inline-flex min-h-11 items-center rounded-xl bg-brand-primary px-5 py-2 font-bold text-brand-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus" href={`${baseHref}&edit=new`}>Tambah {section.label}</Link> : null}
      </div>

      {activeSection === "PROFILE" ? <ProfileEditor profile={profile} showroomUrl={showroomUrl} /> : null}

      {kind && editorOpen ? <div className="rounded-2xl border border-brand-primary/50 bg-zinc-950 p-4 sm:p-6"><ItemEditor cancelHref={baseHref} item={editedItem} key={editedItem?.id ?? `new-${kind}`} kind={kind} /></div> : null}

      {kind && !editorOpen ? <div className="grid gap-3">
        {sectionItems.length ? sectionItems.map(item => <article className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center" key={item.id}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/30">
            {isMediaKind(item.kind) && item.mediaUrl ? <Image alt={item.title} className="object-cover" fill sizes="112px" src={item.mediaUrl} unoptimized /> : <div className="grid h-full place-items-center px-2 text-center text-xs text-zinc-500">{isMediaKind(item.kind) ? "Tanpa gambar" : section.label}</div>}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-bold text-white">{item.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.active ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-700 text-zinc-300"}`}>{item.active ? "Aktif" : "Nonaktif"}</span></div>
            {item.body ? <p className="mt-2 break-words text-sm leading-6 text-zinc-400">{summary(item.body)}</p> : null}
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Urutan {item.sortOrder}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand-focus" href={`${baseHref}&edit=${encodeURIComponent(item.id)}`}>Edit</Link>
            <DeleteItemForm item={item} />
          </div>
        </article>) : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><h3 className="font-bold text-white">Belum ada {section.label.toLowerCase()}</h3><p className="mt-2 text-sm text-zinc-400">Gunakan tombol Tambah untuk membuat konten pertama.</p></div>}
      </div> : null}
    </section>
  </div></CmsFeedback>;
}
