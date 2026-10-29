import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), db: vi.fn(), storage: vi.fn(), refresh: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/db/client", () => ({ db: { $transaction: mocks.db } }));
vi.mock("@/services/storage", () => ({ getStorageProvider: mocks.storage }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
import * as cars from "@/server/cars/actions";
import * as settings from "@/server/settings/actions";
import * as master from "@/server/master-data/actions";
import * as content from "@/server/content/actions";

const empty = { message: "", errors: {} };
const form = () => new FormData();
const actions = [
  { name: "create car", run: () => cars.createCarAction(empty, form()) },
  { name: "update car", run: () => cars.updateCarAction("invalid", empty, form()) },
  { name: "delete car", run: () => cars.deleteCarAction(form()) },
  { name: "upload car image", run: () => cars.uploadImageAction("invalid", empty, form()) },
  { name: "set primary image", run: () => cars.setPrimaryImageAction(form()) },
  { name: "reorder image", run: () => cars.reorderImageAction(form()) },
  { name: "delete image", run: () => cars.deleteImageAction(form()) },
  { name: "save settings", run: () => settings.saveDealerSettingsAction(empty, form()) },
  { name: "upload logo", run: () => settings.uploadDealerLogoAction(empty, form()) },
  { name: "remove logo", run: () => settings.removeDealerLogoAction(empty, form()) },
  { name: "save brand", run: () => master.saveBrandAction(empty, form()) },
  { name: "save model", run: () => master.saveModelAction(empty, form()) },
  { name: "save content profile", run: () => content.saveDealerContentAction(empty, form()) },
  { name: "save content item", run: () => content.saveContentItemAction(empty, form()) },
  { name: "delete content item", run: () => content.deleteContentItemAction(empty, form()) },
];

beforeEach(() => { vi.resetAllMocks(); });
describe("every protected Server Action checks auth before validation or side effects", () => {
  it.each(actions)("$name propagates denial", async ({ run }) => {
    const denial = new Error("NEXT_REDIRECT:/admin/login");
    mocks.auth.mockRejectedValue(denial);
    await expect(run()).rejects.toBe(denial);
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.storage).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
