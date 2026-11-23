import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { HomepageInventoryFooter } from "@/features/homepage/inventory-pagination";
import { clampHomepageInventoryPage, homepagePaginationItems, parseHomepageInventoryPage } from "@/features/homepage/domain";
import { hasUnsavedUploads, pendingUploadIds, reorderUploadQueue, successfulUploadIds, uploadFileFingerprint, type UploadQueueItem } from "@/features/cars/image-upload-queue";

describe("R01 homepage inventory pagination", () => {
  it("parses safe page input, clamps boundaries, and creates compact page indicators", () => {
    expect(parseHomepageInventoryPage("3")).toBe(3);
    expect(parseHomepageInventoryPage(["4", "9"])).toBe(4);
    expect(parseHomepageInventoryPage("0")).toBe(1);
    expect(parseHomepageInventoryPage("../2")).toBe(1);
    expect(clampHomepageInventoryPage(99, 20)).toEqual({ page: 4, totalPages: 4 });
    expect(homepagePaginationItems(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("renders accessible previous/number/next controls, active black page, divider, and centered catalog CTA", () => {
    const html = renderToStaticMarkup(<HomepageInventoryFooter page={2} totalPages={10} />);
    expect(html).toContain('aria-label="Halaman stok mobil"');
    expect(html).toContain("Previous"); expect(html).toContain("Next");
    expect(html).toContain('aria-current="page"'); expect(html).toContain("bg-black");
    expect(html).toContain("<hr"); expect(html).toContain('href="/cars"'); expect(html).toContain("Lihat Semua Mobil");
  });
});

describe("R03 queued vehicle photo workflow", () => {
  const file = (name: string) => new File([name], name, { type: "image/png", lastModified: 1 });
  const item = (id: string, status: UploadQueueItem["status"], serverImageId?: string): UploadQueueItem => ({ id, file: file(`${id}.png`), status, message: "", serverImageId });

  it("keeps deterministic selection identity, ordering, retry candidates, and successful IDs", () => {
    expect(uploadFileFingerprint(file("one.png"))).toBe(uploadFileFingerprint(file("one.png")));
    const queue = [item("one", "success", "saved-one"), item("two", "error"), item("three", "pending")];
    expect(reorderUploadQueue(queue, "three", "up").map(entry => entry.id)).toEqual(["one", "three", "two"]);
    expect(pendingUploadIds(queue)).toEqual(["two", "three"]);
    expect(successfulUploadIds(queue)).toEqual(["saved-one"]);
    expect(hasUnsavedUploads(queue)).toBe(true);
    expect(hasUnsavedUploads([item("one", "success", "saved-one")])).toBe(false);
  });

  it("wires explicit multi-select, preview, ordering, primary choice, progress, retry, and leave protection", () => {
    const source = readFileSync("features/cars/image-manager.tsx", "utf8");
    for (const marker of ["multiple", "Upload Semua", "Hapus pilihan", "Jadikan utama", "Progres upload foto", "Coba lagi", "beforeunload", "Foto belum diunggah"]) expect(source).toContain(marker);
    expect(source).toContain("uploadQueuedImageAction");
    expect(source).not.toContain("useActionState(uploadImageAction");
  });
});

describe("R04 Auto Eighteen favicon", () => {
  it("ships the approved transparent 512px PNG and selects it as the CMS-safe public fallback", async () => {
    const exact = readFileSync("public/auto-18-favicon.png");
    const metadata = await sharp(exact).metadata();
    const stats = await sharp(exact).stats();
    expect(metadata).toMatchObject({ format: "png", width: 512, height: 512, hasAlpha: true });
    expect(stats.channels[3]).toMatchObject({ min: 0, max: 255 });
    const layout = readFileSync("app/(public)/layout.tsx", "utf8");
    expect(layout).toContain('{ url: "/auto-18-favicon.png", type: "image/png" }');
    expect(layout).toContain("dealer.faviconUrl ?");
  });
});
