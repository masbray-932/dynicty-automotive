export const CONTENT_KINDS = ["MAIN_BANNER", "PROMO_BANNER", "ADVANTAGE", "FAQ", "LEASING_PARTNER", "TESTIMONIAL"] as const;
export type ContentKind = typeof CONTENT_KINDS[number];
export const MAX_MAIN_SLIDES = 5;
export const MAX_VISIBLE_ADVANTAGES = 6;
export const AUTOPLAY_MS = 5000;
export const ADVANTAGE_SECTION_TOKEN = "cms:advantage-section";
export const ADVANTAGE_ICON_KEYS = ["quality", "transparent", "professional", "easy", "consultation", "satisfaction"] as const;
export type AdvantageIconKey = typeof ADVANTAGE_ICON_KEYS[number];
const ADVANTAGE_ICON_PREFIX = "cms:advantage-icon:";

export const DEFAULT_ADVANTAGES = [
  { title: "Pilihan Mobil Berkualitas", body: "Beragam pilihan kendaraan untuk kebutuhan dan anggaran Anda.", icon: "quality" },
  { title: "Informasi Transparan", body: "Informasi kendaraan yang jelas untuk membantu Anda menentukan pilihan.", icon: "transparent" },
  { title: "Pelayanan Profesional", body: "Tim yang siap membantu dengan pelayanan ramah dan responsif.", icon: "professional" },
  { title: "Proses Pembelian Mudah", body: "Pendampingan untuk membuat proses pembelian lebih praktis.", icon: "easy" },
  { title: "Konsultasi Kendaraan", body: "Bantuan menemukan kendaraan sesuai kebutuhan dan gaya hidup Anda.", icon: "consultation" },
  { title: "Komitmen Kepuasan Pelanggan", body: "Mengutamakan kenyamanan, komunikasi, dan kepercayaan pelanggan.", icon: "satisfaction" },
] as const satisfies ReadonlyArray<{ title: string; body: string; icon: AdvantageIconKey }>;

export function advantageIconToken(icon: AdvantageIconKey) { return `${ADVANTAGE_ICON_PREFIX}${icon}`; }
export function advantageIconFromToken(value: string): AdvantageIconKey | null {
  if (!value.startsWith(ADVANTAGE_ICON_PREFIX)) return null;
  const icon = value.slice(ADVANTAGE_ICON_PREFIX.length);
  return ADVANTAGE_ICON_KEYS.includes(icon as AdvantageIconKey) ? icon as AdvantageIconKey : null;
}
export function isAdvantageSectionItem(item: Pick<PublicContentItem, "kind" | "link">) {
  return item.kind === "ADVANTAGE" && item.link === ADVANTAGE_SECTION_TOKEN;
}
export function isAdvantageCmsToken(value: string) {
  return value === ADVANTAGE_SECTION_TOKEN || advantageIconFromToken(value) !== null;
}
export function isMediaKind(kind: ContentKind) {
  return kind === "MAIN_BANNER" || kind === "PROMO_BANNER" || kind === "LEASING_PARTNER";
}
export function supportsOptionalMedia(kind: ContentKind) { return kind === "ADVANTAGE"; }
export function safeContentLink(value: string) {
  if (!value) return true;
  if (/[\s\\\u0000-\u001f\u007f]/.test(value) || /%0[ad]|%5c/i.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//") && !value.startsWith("/%");
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export function bannerFit(width: number, height: number): "cover" | "contain" {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > width ? "contain" : "cover";
}
export function bannerRatio(viewportWidth: number) { return viewportWidth >= 1280 ? "21 / 9" : "2 / 1"; }
export function canActivateMain(countExcludingCurrent: number) { return countExcludingCurrent < MAX_MAIN_SLIDES; }
export function canActivateAdvantage(countExcludingCurrent: number) { return countExcludingCurrent < MAX_VISIBLE_ADVANTAGES; }
export type PublicContentItem = {
  id: string; kind: ContentKind; title: string; body: string; link: string;
  active: boolean; sortOrder: number; mediaUrl: string | null;
};
export function visibleItems(items: PublicContentItem[], kind: ContentKind) {
  return items.filter(item => item.kind === kind && item.active && item.title.trim() &&
    (!isMediaKind(kind) || item.mediaUrl) &&
    ((kind !== "FAQ" && kind !== "ADVANTAGE" && kind !== "TESTIMONIAL") || item.body.trim()) &&
    (kind === "ADVANTAGE" ? (!item.link || isAdvantageCmsToken(item.link)) : safeContentLink(item.link)))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .slice(0, kind === "MAIN_BANNER" ? MAX_MAIN_SLIDES : kind === "ADVANTAGE" ? MAX_VISIBLE_ADVANTAGES : 30);
}
