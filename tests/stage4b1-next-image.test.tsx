import { describe, expect, it } from "vitest";
import Image from "next/image";
import { renderToStaticMarkup } from "react-dom/server";
import { VehicleCard } from "@/features/homepage/vehicle-card";
import { shouldBypassImageOptimization } from "@/lib/image-delivery";

describe("real Next Image HTML output (no network request)", () => {
  it("renders uploaded cards without an optimizer URL", () => {
    const html = renderToStaticMarkup(<VehicleCard car={{ id: "x", slug: "x", brand: "Brand", model: "Model", variant: "G", condition: "NEW", year: 2026, price: "100000000", transmission: "CVT", mileage: null, imageUrl: "/uploads/cars/x/front.jpg" }} />);
    expect(html).toContain('src="/uploads/cars/x/front.jpg"');
    expect(html).not.toContain("/_next/image");
  });
  it("retains optimizer output for static raster assets", () => {
    const src = "/images/static-photo.jpg";
    const html = renderToStaticMarkup(<Image alt="Static" src={src} width={200} height={100} unoptimized={shouldBypassImageOptimization(src)} />);
    expect(html).toContain("/_next/image?");
  });
});
