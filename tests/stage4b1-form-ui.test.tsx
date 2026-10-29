import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { actionResult } from "@/types/action-state";
const harness = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0, result: { message: "", errors: {} as Record<string, string[]> }, save: vi.fn() }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown) => factory(),
  useState: (initial: unknown) => {
    const index = harness.cursor++;
    if (!(index in harness.values)) harness.values[index] = typeof initial === "function" ? initial() : initial;
    return [harness.values[index], (next: unknown) => { harness.values[index] = typeof next === "function" ? next(harness.values[index]) : next; }];
  },
  useActionState: (action: (previous: unknown, data: FormData) => unknown) => [harness.result, (data: FormData) => action(harness.result, data), false],
}));
vi.mock("@/server/settings/actions", () => ({ saveDealerSettingsAction: harness.save, uploadDealerLogoAction: harness.save, removeDealerLogoAction: harness.save }));
import { CarForm } from "@/features/cars/car-form";
import { DealerSettingsForm } from "@/features/settings/dealer-settings-form";
import { ActionNotification } from "@/components/ui/action-notification";
import { confirmBrandRename } from "@/features/master-data/rename-confirmation";
import { ConfirmationForm } from "@/components/admin/confirmation-form";

type Props = { children?: ReactNode; name?: string; value?: string; checked?: boolean; required?: boolean; onChange?: (event: { target: { value: string; checked?: boolean; setCustomValidity?: (message: string) => void } }) => void; onClick?: () => void; action?: (data: FormData) => Promise<unknown>; state?: unknown; role?: string; error?: string; htmlFor?: string };
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  return isValidElement<Props>(node) ? [node, ...elements(node.props.children)] : [];
}
function render<T>(component: () => T) { harness.cursor = 0; return component(); }
beforeEach(() => { harness.values = []; harness.cursor = 0; harness.result = { message: "", errors: {} }; vi.clearAllMocks(); });

describe("form wiring regression (hook harness, not browser certification)", () => {
  it("keeps every edited car control across a returned validation error", () => {
    const page = () => CarForm({ action: vi.fn(), brands: [{ id: "brand", name: "Brand", models: [{ id: "model", name: "Model" }] }], submitLabel: "Save" });
    const input = { condition: "NEW", status: "AVAILABLE", modelId: "model", variant: "My variant", year: "2024", price: "invalid-price", mileage: "12999", transmission: "CVT", fuelType: "Bensin", color: "Biru", description: "My unsaved description" };
    let tree = render(page);
    for (const [name, value] of Object.entries(input)) elements(tree).find(x => x.props.name === name)!.props.onChange!({ target: { value } });
    elements(tree).find(x => x.props.name === "featured")!.props.onChange!({ target: { value: "on", checked: true } });
    harness.result = { message: "Periksa data", errors: { price: ["Harga tidak valid"] } };
    tree = render(page);
    for (const [name, value] of Object.entries(input)) expect(elements(tree).find(x => x.props.name === name)?.props.value).toBe(value);
    expect(elements(tree).find(x => x.props.name === "featured")?.props.checked).toBe(true);
    expect(elements(tree).find(x => x.props.htmlFor === "price")?.props.error).toBe("Harga tidak valid");
    elements(tree).find(x => x.props.name === "brandId")!.props.onChange!({ target: { value: "other-brand" } });
    expect(elements(render(page)).find(x => x.props.name === "modelId")?.props.value).toBe("");
  });
  it("preserves settings draft, rejects client whitespace and renders exactly one notification", async () => {
    const page = () => DealerSettingsForm({ values: { dealerName: "Dealer", address: "Old address" }, logoUrl: null });
    let tree = render(page);
    const validity = vi.fn();
    elements(tree).find(x => x.props.name === "address")!.props.onChange!({ target: { value: "   ", setCustomValidity: validity } });
    expect(validity).toHaveBeenCalledWith("Alamat showroom wajib diisi.");
    expect(elements(tree).find(x => x.props.name === "address")?.props.required).toBe(true);
    const outcome = actionResult("error", "Alamat wajib diisi", { address: ["Alamat wajib diisi"] });
    harness.save.mockResolvedValue(outcome);
    const forms = elements(tree).filter(x => x.type === "form" || x.type === ConfirmationForm);
    await forms[1].props.action!(new FormData());
    harness.result = outcome;
    tree = render(page);
    expect(elements(tree).find(x => x.props.name === "address")?.props.value).toBe("   ");
    const notifications = elements(tree).filter(x => x.type === ActionNotification);
    expect(notifications).toHaveLength(1); expect(notifications[0].props.state).toBe(outcome);
  });
  it("success and error notifications have distinct accessible semantics and can be dismissed", () => {
    let result = actionResult("error", "Gagal");
    const notification = () => ActionNotification({ state: result });
    let tree = render(notification);
    expect(tree?.props.role).toBe("alert");
    elements(tree).find(x => x.type === "button")!.props.onClick!();
    expect(render(notification)).toBeNull();
    harness.values = []; result = actionResult("success", "Tersimpan");
    tree = render(notification);
    expect(tree?.props.role).toBe("status");
    expect(renderToStaticMarkup(tree)).toContain("fixed");
    expect(actionResult("success", "Tersimpan").resultId).not.toBe(result.resultId);
  });
});

describe("brand rename confirmation", () => {
  it("shows old/new names and cancellation prevents dispatch", () => {
    const confirm = vi.fn(() => false); const mutate = vi.fn();
    if (confirmBrandRename("Toyota", " Toyota Baru ", confirm)) mutate();
    expect(confirm).toHaveBeenCalledWith('Ubah nama merek "Toyota" menjadi "Toyota Baru"?'); expect(mutate).not.toHaveBeenCalled();
  });
  it("confirmation permits one existing action dispatch", () => {
    const mutate = vi.fn();
    if (confirmBrandRename("Toyota", "Toyota Baru", () => true)) mutate();
    expect(mutate).toHaveBeenCalledTimes(1);
  });
  it("does not prompt on create or unchanged names", () => {
    const confirm = vi.fn();
    expect(confirmBrandRename(undefined, "Toyota", confirm)).toBe(true);
    expect(confirmBrandRename("Toyota", " Toyota ", confirm)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
});
