import Image from "next/image";
import Link from "next/link";
import { formatMileage, formatRupiah } from "@/lib/format";
import { shouldShowMileage } from "./domain";
import type { HomepageCar } from "@/server/homepage/service";

export function VehicleCard({ car }: { car: HomepageCar }) {
  const title = `${car.brand} ${car.model} ${car.variant}`;
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:-translate-y-1 hover:border-red-500/50">
      <Link className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500" href={`/cars/${car.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
          <Image alt={car.imageUrl ? title : `Placeholder gambar ${title}`} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={car.imageUrl ?? "/images/car-placeholder.svg"} unoptimized={Boolean(car.imageUrl)} />
          <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {car.condition === "NEW" ? "BARU" : "BEKAS"}
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400">{car.brand}</p>
          <h3 className="mt-2 line-clamp-2 min-h-12 text-lg font-bold text-white">{car.model} {car.variant}</h3>
          <p className="mt-3 text-xl font-black text-white">{formatRupiah(car.price)}</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-sm text-zinc-400">
            <span>{car.year}</span>
            <span>{car.transmission}</span>
            {shouldShowMileage(car.condition, car.mileage) ? <span>{formatMileage(car.mileage!)}</span> : null}
          </div>
          <span className="mt-5 inline-flex font-semibold text-red-400 transition group-hover:text-red-300">Lihat Detail <span aria-hidden="true" className="ml-2">→</span></span>
        </div>
      </Link>
    </article>
  );
}
