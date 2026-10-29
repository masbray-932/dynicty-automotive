export type CarDraft = Record<"condition" | "status" | "brandId" | "modelId" | "variant" | "year" | "price" | "mileage" | "transmission" | "fuelType" | "color" | "description", string> & { featured: boolean };

export function changeCarDraft(draft: CarDraft, name: keyof CarDraft, value: string | boolean): CarDraft {
  return { ...draft, [name]: value, ...(name === "brandId" && value !== draft.brandId ? { modelId: "" } : {}) };
}
