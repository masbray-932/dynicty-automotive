import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { HomepageInventoryFooter } from "@/features/homepage/inventory-pagination";
import { clampHomepageInventoryPage, homepagePaginationItems, parseHomepageInventoryPage } from "@/features/homepage/domain";
import { arrangeSuccessfulQueue, hasUnsavedUploads, pendingUploadIds, reorderUploadQueue, successfulUploadIds, uploadFileFingerprint, uploadQueueItems, type UploadQueueItem } from "@/features/cars/image-upload-queue";

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
    for (const marker of ["multiple", "Upload Semua", "Hapus pilihan", "Jadikan utama", "Progres upload foto", "Coba lagi", "Coba simpan urutan", "beforeunload", "Foto belum diunggah", "finally"]) expect(source).toContain(marker);
    expect(source).toContain("uploadQueuedImageAction");
    expect(source).not.toContain("useActionState(uploadImageAction");
  });

  it("recovers unexpected upload failures, continues the batch, and preserves successful server IDs", async () => {
    const existing = item("existing", "success", "saved-existing");
    const first = item("first", "pending");
    const second = item("second", "pending");
    const upload = vi.fn()
      .mockRejectedValueOnce(new Error("network interrupted"))
      .mockResolvedValueOnce({ status: "success", message: "Tersimpan", errors: {}, image: { id: "saved-second" } });
    const states: UploadQueueItem[][] = [];
    const result = await uploadQueueItems({
      items: [existing, first, second],
      ids: [first.id, second.id],
      upload,
      onChange: next => states.push(next),
    });
    expect(result).toMatchObject([
      { id: "existing", status: "success", serverImageId: "saved-existing" },
      { id: "first", status: "error" },
      { id: "second", status: "success", serverImageId: "saved-second" },
    ]);
    expect(result[1].message).toContain("gangguan tak terduga");
    expect(upload).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toEqual(result);

    const retryUpload = vi.fn().mockResolvedValue({ status: "success", message: "Tersimpan", errors: {}, image: { id: "saved-first" } });
    const retried = await uploadQueueItems({ items: result, ids: result.map(entry => entry.id), upload: retryUpload });
    expect(retryUpload).toHaveBeenCalledTimes(1);
    expect(successfulUploadIds(retried)).toEqual(["saved-existing", "saved-first", "saved-second"]);
  });

  it("retries arrangement with preserved IDs without invoking uploads again", async () => {
    const items = [item("one", "success", "saved-one"), item("two", "success", "saved-two")];
    const arrange = vi.fn()
      .mockRejectedValueOnce(new Error("temporary arrangement failure"))
      .mockResolvedValueOnce({ status: "success", message: "Urutan tersimpan" });
    const first = await arrangeSuccessfulQueue({ items, primaryQueueId: "two", arrange });
    const second = await arrangeSuccessfulQueue({ items, primaryQueueId: "two", arrange });
    expect(first).toMatchObject({ ok: false });
    expect(first.message).toContain("Foto sudah tersimpan");
    expect(second).toEqual({ ok: true, message: "Urutan tersimpan" });
    expect(arrange).toHaveBeenNthCalledWith(1, ["saved-one", "saved-two"], "saved-two");
    expect(arrange).toHaveBeenNthCalledWith(2, ["saved-one", "saved-two"], "saved-two");
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
