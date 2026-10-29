import { describe, expect, it } from "vitest";
import { brandConfirmation, modelConfirmation, vehicleConfirmation, settingsConfirmation, profileConfirmation, contentConfirmation } from "@/features/admin/confirmation-policy";

function form(values: Record<string, string> = {}) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
const vehicle = { price: "100000000", status: "AVAILABLE", condition: "USED", brandId: "b", modelId: "m", variant: "G", year: "2025", mileage: "2000", transmission: "CVT", fuelType: "Bensin", color: "Biru", featured: false };
const vehicleForm = () => form(Object.fromEntries(Object.entries(vehicle).filter(([key]) => key !== "featured").map(([key, value]) => [key, String(value)])));

describe("vehicle impact classification", () => {
  it("does not confirm routine description or price formatting", () => {
    const data = vehicleForm(); data.set("description", "Description changed"); data.set("price", "100.000.000");
    expect(vehicleConfirmation(vehicle, data)).toBeNull();
  });
  it.each(["price", "status", "condition", "brandId", "modelId", "variant", "year", "mileage", "transmission", "fuelType", "color", "featured"])("confirms %s in a combined save", key => {
    const data = vehicleForm(); data.set(key, key === "featured" ? "on" : "new-value");
    expect(vehicleConfirmation(vehicle, data)?.changes).toHaveLength(1);
  });
  it.each(["DRAFT", "AVAILABLE", "SOLD"])("confirms reversing SOLD to %s when actually changed", status => {
    const data = vehicleForm(); data.set("status", status);
    expect(Boolean(vehicleConfirmation({ ...vehicle, status: "SOLD" }, data))).toBe(status !== "SOLD");
  });
  it("confirms publishing a new vehicle but not draft creation", () => {
    expect(vehicleConfirmation(undefined, form({ status: "DRAFT" }))).toBeNull();
    expect(vehicleConfirmation(undefined, form({ status: "AVAILABLE" }))?.actionLabel).toBe("Publikasikan");
  });
});

describe("master data and settings classification", () => {
  it("D-001 includes old and new brand names; create and no-op are routine", () => {
    expect(brandConfirmation({ name: "Toyota" }, form({ name: " Toyota Baru " }))?.changes).toEqual([{ label: "Nama merek", before: "Toyota", after: "Toyota Baru" }]);
    expect(brandConfirmation(undefined, form({ name: "Toyota" }))).toBeNull();
    expect(brandConfirmation({ name: "Toyota" }, form({ name: " Toyota " }))).toBeNull();
  });
  it("confirms model rename and parent-brand change, not create/no-op", () => {
    expect(modelConfirmation({ name: "Avanza", brandId: "b" }, form({ name: "Veloz", brandId: "c" }))?.changes).toHaveLength(2);
    expect(modelConfirmation(undefined, form({ name: "New" }))).toBeNull();
    expect(modelConfirmation({ name: "Avanza", brandId: "b" }, form({ name: "Avanza", brandId: "b" }))).toBeNull();
  });
  it.each(["dealerName", "whatsappNumber", "phone", "email", "address", "googleMapsUrl", "instagramUrl", "facebookUrl"])("confirms dealer %s", name => {
    expect(settingsConfirmation({}, form({ [name]: "changed" }))?.changes?.some(change => change.after === "changed")).toBe(true);
  });
  it("does not confirm cosmetic colors or unchanged fallback identity", () => {
    expect(settingsConfirmation({}, form({ dealerName: "Dynicty Automotive", primaryColor: "#123456", secondaryColor: "#abcdef" }))).toBeNull();
  });
});

describe("CMS impact classification", () => {
  it.each(["welcomeActive", "aboutActive", "operatingHoursActive"])("confirms publication toggle %s", name => {
    expect(profileConfirmation({ [name]: true }, form())?.changes).toHaveLength(1);
    expect(profileConfirmation(null, form({ [name]: "on" }))?.changes?.length).toBeGreaterThan(0);
  });
  it("confirms operating hours and showroom replacement/removal", () => {
    const original = { showroomKey: "existing", operatingHoursActive: true, operatingHours: "Monday" };
    const data = form({ operatingHoursActive: "on", operatingHours: "Tuesday", removeImage: "on" });
    expect(profileConfirmation(original, data)?.changes).toHaveLength(2);
    data.set("image", new File(["image"], "x.png"));
    expect(profileConfirmation(original, data)?.changes?.find(x => x.label === "Foto showroom")?.after).toBe("Diganti");
  });
  it("keeps text and ordering routine unless publication/media/link changes", () => {
    expect(profileConfirmation({ welcomeActive: true }, form({ welcomeActive: "on", welcomeTitle: "New text" }))).toBeNull();
    const item = { title: "FAQ", active: true, link: "" };
    expect(contentConfirmation(item, form({ active: "on", body: "New answer", sortOrder: "4" }))).toBeNull();
    expect(contentConfirmation(item, form({ body: "New answer" }))?.changes).toHaveLength(1);
    expect(contentConfirmation(undefined, form({ title: "Draft" }))).toBeNull();
  });
  it("confirms active banner media/link changes and new publication", () => {
    const item = { title: "Promo", active: true, link: "/cars" };
    const data = form({ active: "on", link: "/about" });
    expect(contentConfirmation(item, data)).not.toBeNull();
    data.set("link", "/cars"); data.set("image", new File(["image"], "x.png"));
    expect(contentConfirmation(item, data)).not.toBeNull();
    expect(contentConfirmation(undefined, form({ active: "on" }))).not.toBeNull();
  });
});
