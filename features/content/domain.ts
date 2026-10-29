export const CONTENT_KINDS = ["MAIN_BANNER", "PROMO_BANNER", "ADVANTAGE", "FAQ", "LEASING_PARTNER"] as const;
export type ContentKind = typeof CONTENT_KINDS[number];
export const MAX_MAIN_SLIDES = 5;
export const AUTOPLAY_MS = 5000;
export function isMediaKind(kind: ContentKind) {
  return kind === "MAIN_BANNER" || kind === "PROMO_BANNER" || kind === "LEASING_PARTNER";
}
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
export type PublicContentItem = {
  id: string; kind: ContentKind; title: string; body: string; link: string;
  active: boolean; sortOrder: number; mediaUrl: string | null;
};
export function visibleItems(items: PublicContentItem[], kind: ContentKind) {
  return items.filter(item => item.kind === kind && item.active && item.title.trim() &&
    (!isMediaKind(kind) || item.mediaUrl) &&
    ((kind !== "FAQ" && kind !== "ADVANTAGE") || item.body.trim()) && safeContentLink(item.link))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .slice(0, kind === "MAIN_BANNER" ? MAX_MAIN_SLIDES : 30);
}
