import { describe, expect, it } from "vitest";
import { carFormSchema, parseMileage, parsePrice } from "@/validation/car";

const validCar = {
  condition: "USED" as const,
  brandId: "clh0000000000000000000001",
  modelId: "clh0000000000000000000002",
  variant: "1.5 G CVT",
  year: 2022,
  price: "225.000.000",
  transmission: "Automatic",
  fuelType: "Bensin",
  color: "Hitam",
  mileage: "25.000",
  description: "Kondisi terawat dan siap digunakan.",
  status: "AVAILABLE" as const,
  featured: false,
};

describe("car validation", () => {
  it("parses Rupiah without floating point conversion", () => {
    expect(parsePrice("225.000.000")).toBe("225000000");
    expect(() => parsePrice("225000000.50")).toThrow();
  });

  it("requires positive mileage for used cars", () => {
    expect(carFormSchema.safeParse({ ...validCar, mileage: "" }).success).toBe(false);
    expect(carFormSchema.safeParse(validCar).success).toBe(true);
  });

  it("allows null-equivalent mileage for new cars", () => {
    expect(carFormSchema.safeParse({ ...validCar, condition: "NEW", mileage: "" }).success).toBe(true);
    expect(parseMileage("")).toBeNull();
  });
});
