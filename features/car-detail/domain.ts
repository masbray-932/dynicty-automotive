import { normalizeWhatsappNumber } from "@/features/homepage/domain";

export const CAR_PLACEHOLDER_IMAGE = "/images/car-placeholder.svg";

export function isValidCarSlug(slug: string) {
  return slug.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function isPublicDetailVisible(status: "DRAFT" | "AVAILABLE" | "SOLD") {
  return status === "AVAILABLE";
}

export function buildVehicleTitle(parts: { brand: string; model: string; variant: string; year: number }) {
  return [parts.brand, parts.model, parts.variant, String(parts.year)].map((value) => value.trim()).filter(Boolean).join(" ");
}

export type DetailImage = { id: string; url: string; isPrimary: boolean; sortOrder: number; createdAt: Date };

export function orderDetailImages(images: DetailImage[]) {
  return [...images].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    return left.sortOrder - right.sortOrder || left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id);
  });
}

export function buildVehicleSeoDescription(input: { title: string; transmission: string; dealerName: string }) {
  return `${input.title}, transmisi ${input.transmission}, tersedia di ${input.dealerName}. Lihat harga, spesifikasi, dan hubungi sales.`;
}

export function buildWhatsappMessage(input: { title: string; price: string; url?: string | null }) {
  const link = input.url ? ` ${input.url}` : "";
  return `Halo, saya tertarik dengan ${input.title} dengan harga ${input.price} yang ada di website. Apakah unit ini masih tersedia?${link}`;
}

export function createVehicleWhatsappUrl(number: string | null | undefined, input: { title: string; price: string; url?: string | null }) {
  const normalized = normalizeWhatsappNumber(number);
  if (!normalized) return null;
  const query = new URLSearchParams({ text: buildWhatsappMessage(input) });
  return `https://wa.me/${normalized}?${query.toString()}`;
}

export function selectRelatedVehicles<T extends { id: string; status: "DRAFT" | "AVAILABLE" | "SOLD"; brandId: string; modelId: string; updatedAt: Date }>(cars: T[], current: { id: string; brandId: string; modelId: string }, limit = 3) {
  return cars
    .filter((car) => car.id !== current.id && car.status === "AVAILABLE")
    .sort((left, right) => {
      const rank = (car: T) => car.modelId === current.modelId ? 0 : car.brandId === current.brandId ? 1 : 2;
      return rank(left) - rank(right) || right.updatedAt.getTime() - left.updatedAt.getTime() || left.id.localeCompare(right.id);
    })
    .slice(0, limit);
}
