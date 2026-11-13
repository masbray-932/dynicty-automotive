import Image from "next/image";
import Link from "next/link";
import { formatMileage, formatRupiah } from "@/lib/format";
import { shouldShowMileage } from "./domain";
import type { HomepageCar } from "@/server/homepage/service";
import { shouldBypassImageOptimization } from "@/lib/image-delivery";

export function VehicleCard({ car }: { car: HomepageCar }) {
  const title = `${car.brand} ${car.model} ${car.variant}`;
  return (
    <article className="group overflow-hidden rounded-lg border border-[#E5E5E5] bg-white transition hover:-translate-y-1 hover:shadow-[0_12px_28px_-10px_rgba(23,23,23,0.18)]">
      <Link className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus" href={`/cars/${car.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F6F6F6]">
          <Image alt={car.imageUrl ? title : `Placeholder gambar ${title}`} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={car.imageUrl ?? "/images/car-placeholder.svg"} unoptimized={shouldBypassImageOptimization(car.imageUrl ?? "/images/car-placeholder.svg")} />
          <span className="absolute left-3 top-3 rounded-sm bg-[#171717] px-3 py-1 text-[10px] font-extrabold tracking-wider text-white backdrop-blur">
            {car.condition === "NEW" ? "BARU" : "BEKAS"}
          </span>
        </div>
        <div className="p-5">
          <p className="public-eyebrow">{car.brand}</p>
          <h3 className="mt-2 line-clamp-2 min-h-12 text-lg font-bold text-[#171717]">{car.model} {car.variant}</h3>
          <p className="mt-3 text-xl font-extrabold tabular-nums text-[#C8102E]">{formatRupiah(car.price)}</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#E5E5E5] pt-4 text-sm text-[#606060]">
            <span>{car.year}</span>
            <span>{car.transmission}</span>
            {shouldShowMileage(car.condition, car.mileage) ? <span>{formatMileage(car.mileage!)}</span> : null}
          </div>
          <span className="mt-5 inline-flex text-xs font-extrabold uppercase tracking-wider text-[#171717] transition group-hover:text-[#C8102E]">Lihat Detail <span aria-hidden="true" className="ml-2">→</span></span>
        </div>
      </Link>
    </article>
  );
}
