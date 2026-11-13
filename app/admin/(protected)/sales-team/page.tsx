import Image from "next/image";
import { AdminEditorPanel } from "@/components/admin/admin-editor-panel";
import { AdminEmptyState, AdminPageHeader, AdminSection, AdminStatusBadge } from "@/components/admin/admin-ui";
import { CmsFeedback } from "@/features/content/cms-feedback";
import { SalesTeamEditor } from "@/features/sales-team/sales-team-editor";
import { requireAdmin } from "@/server/auth/session";
import { getAdminSalesTeam } from "@/server/sales-team/service";

export default async function SalesTeamPage() {
  await requireAdmin();
  const members = await getAdminSalesTeam();
  return <CmsFeedback><div className="mx-auto grid max-w-6xl gap-6"><AdminPageHeader eyebrow="Profil dealer" title="Tim Sales" description="Kelola profil publik tim penjualan. Profil ini bukan akun login Admin." actions={<AdminEditorPanel label="Tambah anggota" title="Anggota tim baru"><SalesTeamEditor /></AdminEditorPanel>} />
    <AdminSection title={`Daftar anggota (${members.length})`} description="Urutan kecil ditampilkan lebih dahulu. Hanya anggota aktif yang terlihat di website.">{members.length ? <div className="grid gap-3 sm:grid-cols-2">{members.map(member => <article className="grid gap-4 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[5rem_1fr]" key={member.id}>{member.imageUrl ? <Image alt={`Foto ${member.fullName}`} className="h-20 w-20 rounded-xl object-cover" height={80} src={member.imageUrl} unoptimized width={80} /> : <div className="grid h-20 w-20 place-items-center rounded-xl bg-white/5 text-center text-xs text-zinc-500">Tanpa foto</div>}<div className="min-w-0"><h3 className="font-bold text-white">{member.fullName}</h3><p className="mt-1 text-sm text-zinc-400">{member.title}</p><div className="mt-2 flex flex-wrap items-center gap-2"><AdminStatusBadge tone={member.active ? "success" : "neutral"}>{member.active ? "Aktif" : "Nonaktif"}</AdminStatusBadge><span className="text-xs text-zinc-500">Urutan {member.sortOrder}</span></div><div className="mt-3"><AdminEditorPanel label="Edit" title={`Edit ${member.fullName}`}><SalesTeamEditor member={{ id: member.id, fullName: member.fullName, title: member.title, whatsappNumber: member.whatsappNumber, biography: member.biography, active: member.active, sortOrder: member.sortOrder, imageUrl: member.imageUrl }} /></AdminEditorPanel></div></div></article>)}</div> : <AdminEmptyState title="Belum ada tim sales" description="Tambahkan profil saat aset dan informasi resmi sudah tersedia. Tidak ada profil yang dibuat otomatis." />}</AdminSection>
  </div></CmsFeedback>;
}
