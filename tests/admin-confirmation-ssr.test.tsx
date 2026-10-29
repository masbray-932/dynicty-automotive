import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync } from "node:fs";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { criticalAction } from "@/features/admin/confirmation-policy";

describe("confirmation SSR and mutation coverage", () => {
  it("blocks submission before hydration and emits accessible dialog labels", () => {
    const html = renderToStaticMarkup(<ConfirmationForm action={async () => {}} confirmation={() => criticalAction("Delete", "Cannot undo", "Delete", true)}><button type="submit">Delete</button></ConfirmationForm>);
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toContain('role="dialog"'); expect(html).toContain('aria-modal="true"');
    expect(html).toContain("aria-labelledby="); expect(html).toContain("aria-describedby=");
    expect(html).toContain("Batal"); expect(html).not.toContain("window.confirm");
  });
  it("keeps logout direct and unchanged by any confirmation wrapper", () => {
    const source = readFileSync("components/admin/admin-nav.tsx", "utf8");
    expect(source).toContain('<form action={logoutAction}>');
    expect(source).not.toContain("ConfirmationForm");
  });
  it("has no native confirmation calls in any supported admin feature", () => {
    for (const directory of ["features/cars", "features/master-data", "features/settings", "features/content"]) {
      for (const name of readdirSync(directory).filter(name => name.endsWith(".tsx"))) {
        expect(readFileSync(`${directory}/${name}`, "utf8"), `${directory}/${name}`).not.toMatch(/window\.confirm\s*\(/);
      }
    }
  });
  it("wires every classified critical mutation group into the shared gate", () => {
    for (const [file, expected] of [
      ["features/cars/car-form.tsx", "vehicleConfirmation(defaults, data)"],
      ["features/cars/delete-car-button.tsx", "action={deleteCarAction}"],
      ["features/cars/image-manager.tsx", "action={setPrimaryImageAction}"],
      ["features/cars/image-manager.tsx", "action={deleteImageAction}"],
      ["features/master-data/master-data-forms.tsx", "modelConfirmation(model, data)"],
      ["features/master-data/master-data-forms.tsx", "brandConfirmation(brand, data)"],
      ["features/settings/dealer-settings-form.tsx", "settingsConfirmation(values, data)"],
      ["features/content/content-editor.tsx", "profileConfirmation(profile, data)"],
      ["features/content/content-editor.tsx", "contentConfirmation(item, data)"],
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("ConfirmationForm"); expect(source).toContain(expected);
    }
  });
});
