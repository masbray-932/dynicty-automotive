import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), content: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/server/content/service", () => ({ getAdminDealerContent: mocks.content }));
vi.mock("next/image", () => ({ default: ({ alt }: { alt: string }) => <span role="img">{alt}</span> }));
vi.mock("@/features/content/cms-feedback", () => ({ CmsFeedback: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/features/content/content-editor", () => ({
  ProfileEditor: () => <div>PROFILE_EDITOR</div>,
  ItemEditor: ({ item, kind, cancelHref }: { item?: { id: string }; kind: string; cancelHref: string }) => <div>ITEM_EDITOR:{item?.id ?? "new"}:{kind}:CANCEL={cancelHref}</div>,
  DeleteItemForm: ({ item }: { item: { id: string } }) => <button>DELETE:{item.id}</button>,
}));
import ContentPage from "@/app/admin/(protected)/content/page";
import type { PublicContentItem } from "@/features/content/domain";

const items: PublicContentItem[] = [
  { id: "hero", kind: "MAIN_BANNER", title: "Hero utama", body: "", link: "", active: true, sortOrder: 1, mediaUrl: "/hero.png" },
  { id: "faq", kind: "FAQ", title: "Pertanyaan umum", body: "Jawaban ringkas", link: "", active: false, sortOrder: 3, mediaUrl: null },
];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ id: "admin" });
  mocks.content.mockResolvedValue({ profile: null, showroomUrl: null, items });
});

describe("Admin content section navigation", () => {
  it("exposes all seven sections and renders only the selected profile editor by default", async () => {
    const html = renderToStaticMarkup(await ContentPage({}));
    for (const label of ["Profil Dealer", "Banner Utama", "Banner Promo", "Keunggulan", "FAQ", "Partner", "Testimoni"]) expect(html).toContain(label);
    expect(html).toContain("PROFILE_EDITOR");
    expect(html).not.toContain("ITEM_EDITOR");
    expect(html).not.toContain("Hero utama");
  });

  it("renders compact records, status, order, edit, delete and add controls without a full editor", async () => {
    const html = renderToStaticMarkup(await ContentPage({ searchParams: Promise.resolve({ section: "MAIN_BANNER" }) }));
    expect(html).toContain("Hero utama");
    expect(html).toContain("Aktif");
    expect(html).toContain("Urutan 1");
    expect(html).toContain("DELETE:hero");
    expect(html).toContain("section=MAIN_BANNER&amp;edit=hero");
    expect(html).toContain("section=MAIN_BANNER&amp;edit=new");
    expect(html).not.toContain("ITEM_EDITOR");
    expect(html).not.toContain("Pertanyaan umum");
  });

  it("opens only the requested add or edit form and provides a cancel destination", async () => {
    const edit = renderToStaticMarkup(await ContentPage({ searchParams: Promise.resolve({ section: "FAQ", edit: "faq" }) }));
    expect(edit).toContain("ITEM_EDITOR:faq:FAQ:CANCEL=/admin/content?section=FAQ");
    expect(edit).not.toContain("DELETE:faq");
    expect(edit).not.toContain("Hero utama");
    const add = renderToStaticMarkup(await ContentPage({ searchParams: Promise.resolve({ section: "FAQ", edit: "new" }) }));
    expect(add).toContain("ITEM_EDITOR:new:FAQ:CANCEL=/admin/content?section=FAQ");
  });

  it("ignores an edit id from another section instead of exposing the wrong record", async () => {
    const html = renderToStaticMarkup(await ContentPage({ searchParams: Promise.resolve({ section: "FAQ", edit: "hero" }) }));
    expect(html).not.toContain("ITEM_EDITOR");
    expect(html).toContain("Pertanyaan umum");
  });
});
