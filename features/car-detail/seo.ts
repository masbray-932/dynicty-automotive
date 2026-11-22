import { shouldShowMileage } from "@/features/homepage/domain";
import { dealerSchemaId, serializeJsonLd } from "@/features/seo/structured-data";

type VehicleSeoInput = {
  id: string;
  title: string;
  description: string;
  condition: "NEW" | "USED";
  brand: string;
  model: string;
  year: number;
  price: string;
  transmission: string;
  fuelType: string;
  color: string;
  mileage: number | null;
  images: string[];
  url: string;
  dealerName: string;
  dealerUrl: string;
};

export function buildVehicleStructuredData(vehicle: VehicleSeoInput) {
  const images = vehicle.images.map((image) => new URL(image, vehicle.url).toString());
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": `${vehicle.url}#vehicle`,
    url: vehicle.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": vehicle.url },
    sku: vehicle.id,
    productID: vehicle.id,
    name: vehicle.title,
    description: vehicle.description,
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    color: vehicle.color,
    ...(shouldShowMileage(vehicle.condition, vehicle.mileage)
      ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" } }
      : {}),
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      itemCondition: vehicle.condition === "NEW"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
      url: vehicle.url,
      seller: { "@id": dealerSchemaId(vehicle.dealerUrl), name: vehicle.dealerName },
    },
  };
}

export { serializeJsonLd };
