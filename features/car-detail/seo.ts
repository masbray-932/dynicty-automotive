import { shouldShowMileage } from "@/features/homepage/domain";

type VehicleSeoInput = {
  title: string;
  description: string;
  condition: "NEW" | "USED";
  brand: string;
  model: string;
  year: number;
  price: string;
  transmission: string;
  fuelType: string;
  mileage: number | null;
  images: string[];
  url: string;
};

export function buildVehicleStructuredData(vehicle: VehicleSeoInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicle.title,
    description: vehicle.description,
    ...(vehicle.images.length ? { image: vehicle.images } : {}),
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    ...(shouldShowMileage(vehicle.condition, vehicle.mileage)
      ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" } }
      : {}),
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: vehicle.url,
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
