export const HOMEPAGE_CAR_LIMIT = 6;

export type PublicCarStatus = "DRAFT" | "AVAILABLE" | "SOLD";
export type PublicCarCondition = "NEW" | "USED";

export type DealerPresentation = {
  dealerName: string;
  logoUrl: string | null;
  whatsappNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export const dealerFallback: DealerPresentation = {
  dealerName: "Dynicty Automotive",
  logoUrl: null,
  whatsappNumber: null,
  phone: null,
  email: null,
  address: null,
  instagramUrl: null,
  facebookUrl: null,
  primaryColor: null,
  secondaryColor: null,
};

export function isHomepageCarVisible(status: PublicCarStatus) {
  return status === "AVAILABLE";
}

export function selectFeaturedHomepageCars<T extends {
  id: string;
  status: PublicCarStatus;
  featured: boolean;
  updatedAt: Date;
  hasImage: boolean;
}>(cars: T[], limit = HOMEPAGE_CAR_LIMIT) {
  return cars
    .filter((car) => isHomepageCarVisible(car.status) && car.featured)
    .sort((left, right) => {
      if (left.hasImage !== right.hasImage) return left.hasImage ? -1 : 1;
      const dateDifference = right.updatedAt.getTime() - left.updatedAt.getTime();
      return dateDifference || left.id.localeCompare(right.id);
    })
    .slice(0, limit);
}

export function shouldShowMileage(condition: PublicCarCondition, mileage: number | null) {
  return condition === "USED" && mileage !== null && mileage > 0;
}

export function normalizeWhatsappNumber(value: string | null | undefined) {
  if (!value) return null;
  const input = value.trim();
  if (!/^[+\d\s().-]+$/.test(input)) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return /^\d{10,15}$/.test(digits) ? digits : null;
}

export function createWhatsappUrl(value: string | null | undefined) {
  const number = normalizeWhatsappNumber(value);
  return number ? `https://wa.me/${number}` : null;
}

export type HomepageSearchInput = {
  condition?: string;
  brand?: string;
  model?: string;
  q?: string;
};

export function createHomepageSearchParams(input: HomepageSearchInput) {
  const parameters = new URLSearchParams();
  const condition = input.condition?.toUpperCase();
  if (condition === "NEW" || condition === "USED") parameters.set("condition", condition);
  for (const key of ["brand", "model", "q"] as const) {
    const value = input[key]?.trim();
    if (value) parameters.set(key, value);
  }
  return parameters.toString();
}

export function mergeDealerPresentation(
  settings: Partial<Omit<DealerPresentation, "logoUrl">> | null,
  logoUrl: string | null = null,
): DealerPresentation {
  const clean = (value: string | null | undefined, fallback: string | null = null) => {
    const normalized = value?.trim();
    return normalized || fallback;
  };
  return {
    dealerName: clean(settings?.dealerName, dealerFallback.dealerName)!,
    logoUrl,
    whatsappNumber: clean(settings?.whatsappNumber),
    phone: clean(settings?.phone),
    email: clean(settings?.email),
    address: clean(settings?.address),
    instagramUrl: clean(settings?.instagramUrl),
    facebookUrl: clean(settings?.facebookUrl),
    primaryColor: clean(settings?.primaryColor),
    secondaryColor: clean(settings?.secondaryColor),
  };
}
