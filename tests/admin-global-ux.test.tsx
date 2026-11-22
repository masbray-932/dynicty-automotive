import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { AdminEditorPanel } from "@/components/admin/admin-editor-panel";
import { AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";

describe("global Admin UX primitives", () => {
  it("keeps editors closed by default and exposes an accessible Add/Edit trigger", () => {
    const html = renderToStaticMarkup(<AdminEditorPanel label="Tambah layanan" title="Layanan baru"><form><input name="title" /></form></AdminEditorPanel>);
    expect(html).toContain("Tambah layanan");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('name="title"');
  });

  it("renders an open editor with Cancel and its existing action controls intact", () => {
    const html = renderToStaticMarkup(<AdminEditorPanel defaultOpen label="Edit" title="Edit artikel"><form><input name="title" /><button type="submit">Simpan</button></form></AdminEditorPanel>);
    expect(html).toContain("Edit artikel");
    expect(html).toContain("Batal");
    expect(html).toContain('name="title"');
    expect(html).toContain("Simpan");
  });

  it("provides consistent headings and status semantics", () => {
    const html = renderToStaticMarkup(<><AdminPageHeader eyebrow="Inventori" title="Kelola Mobil" description="Kelola data." /><AdminStatusBadge tone="success">Aktif</AdminStatusBadge></>);
    expect(html).toContain("Inventori");
    expect(html).toContain("Kelola Mobil");
    expect(html).toContain("Aktif");
  });

  it("covers every protected Admin page with the shared header and preserves all navigation destinations", () => {
    for (const file of [
      "app/admin/(protected)/page.tsx",
      "app/admin/(protected)/cars/page.tsx",
      "app/admin/(protected)/cars/new/page.tsx",
      "app/admin/(protected)/cars/[id]/edit/page.tsx",
      "app/admin/(protected)/brands/page.tsx",
      "app/admin/(protected)/services/page.tsx",
      "app/admin/(protected)/articles/page.tsx",
      "app/admin/(protected)/sales-team/page.tsx",
      "app/admin/(protected)/content/page.tsx",
      "app/admin/(protected)/settings/page.tsx",
    ]) expect(readFileSync(file, "utf8"), file).toContain("AdminPageHeader");
    const nav = readFileSync("components/admin/admin-nav.tsx", "utf8");
    for (const href of ["/admin/cars", "/admin/brands", "/admin/services", "/admin/articles", "/admin/sales-team", "/admin/content", "/admin/settings"]) expect(nav).toContain(href);
  });

  it("warns for dirty on-demand and long-form Admin edits", () => {
    expect(readFileSync("components/admin/admin-editor-panel.tsx", "utf8")).toContain('addEventListener("beforeunload"');
    expect(readFileSync("components/admin/admin-form-guard.tsx", "utf8")).toContain('addEventListener("beforeunload"');
  });
});
