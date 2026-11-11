import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), read: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/server/sales-team/service", () => ({ getAdminSalesTeam: mocks.read }));
vi.mock("@/server/sales-team/actions", () => ({ saveSalesTeamAction: vi.fn(), deleteSalesTeamAction: vi.fn() }));
import SalesTeamPage from "@/app/admin/(protected)/sales-team/page";

it("rejects before reading private sales profiles", async () => {
  const denial = new Error("NEXT_REDIRECT:/admin/login"); mocks.auth.mockRejectedValue(denial);
  await expect(SalesTeamPage()).rejects.toBe(denial); expect(mocks.read).not.toHaveBeenCalled();
});

it("renders the authenticated empty state without creating fake profiles", async () => {
  mocks.auth.mockResolvedValue({ id: "admin" }); mocks.read.mockResolvedValue([]);
  const html = renderToStaticMarkup(await SalesTeamPage());
  expect(html).toContain("Tim Sales"); expect(html).toContain("Belum ada tim sales"); expect(html).toContain("Tambah anggota");
});
