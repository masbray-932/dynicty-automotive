import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { createWhatsappUrl } from "@/features/homepage/domain";
import { QuickSearch } from "@/features/homepage/quick-search";
import { VehicleCard } from "@/features/homepage/vehicle-card";
import { getHomepageData } from "@/server/homepage/service";

export const metadata: Metadata = {
  title: "Dealer Mobil Baru & Bekas",
  description: "Temukan pilihan mobil baru dan bekas berkualitas dengan informasi yang jelas dan proses yang mudah bersama Dynicty Automotive.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Dynicty Automotive — Dealer Mobil Baru & Bekas",
    description: "Jelajahi mobil baru, mobil bekas, kendaraan unggulan, dan pilihan berdasarkan merek.",
    url: "/",
  },
};

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="mb-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-400">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
      {copy ? <p className="mt-3 max-w-2xl text-zinc-400">{copy}</p> : null}
    </div>
  );
}

function EmptyInventory({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 px-6 py-12 text-center text-zinc-400">
      <p>{message}</p>
      <Link className="mt-4 inline-flex font-semibold text-red-400 hover:text-red-300" href="/cars">Lihat halaman katalog</Link>
    </div>
  );
}

const benefits = [
  ["01", "Pilihan Mobil Berkualitas", "Jelajahi mobil baru dan bekas yang tersedia di dealer."],
  ["02", "Informasi Transparan", "Lihat detail penting kendaraan dengan penyajian yang jelas."],
  ["03", "Proses Mudah", "Temukan kendaraan lalu hubungi dealer melalui alur yang sederhana."],
  ["04", "Konsultasi Penjualan", "Diskusikan kebutuhan kendaraan dengan tim penjualan."],
];

export default async function HomePage() {
  await connection();
  const { featuredCars, latestCars, brands, dealer } = await getHomepageData();
  const whatsappUrl = createWhatsappUrl(dealer.whatsappNumber);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <PageContainer className="grid min-h-[620px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-red-400">Mobil baru & bekas</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">Temukan Mobil Impian Anda</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">Pilihan mobil baru dan bekas berkualitas dengan informasi yang jelas dan proses yang mudah.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-12 items-center rounded-xl bg-red-600 px-6 font-bold text-white transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500" href="/cars">Lihat Semua Mobil</Link>
              <Link className="inline-flex min-h-12 items-center rounded-xl border border-white/20 px-6 font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" href="/cars?condition=USED">Cari Mobil Bekas</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-10 rounded-full bg-red-600/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
              <Image alt="Ilustrasi kendaraan Dynicty Automotive" className="h-auto w-full" height={600} priority src="/images/car-placeholder.svg" width={800} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-6 pt-20"><p className="font-bold text-white">Pilihan tepat untuk perjalanan berikutnya.</p></div>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="relative z-20 -mt-8"><QuickSearch brands={brands} /></PageContainer>

      <section className="py-20"><PageContainer>
        <div className="grid gap-5 md:grid-cols-2">
          <Link className="group min-h-64 rounded-3xl border border-white/10 bg-zinc-900 p-8 transition hover:border-red-500/60 focus-visible:outline-2 focus-visible:outline-red-500" href="/cars?condition=NEW">
            <p className="text-sm font-bold tracking-[0.2em] text-red-400">MOBIL BARU</p><h2 className="mt-4 text-3xl font-black text-white">Mulai perjalanan dengan yang baru.</h2><p className="mt-3 max-w-md text-zinc-400">Jelajahi kendaraan baru yang tersedia dan temukan model yang sesuai kebutuhan Anda.</p><span className="mt-8 inline-flex font-bold text-white group-hover:text-red-400">Lihat Mobil Baru →</span>
          </Link>
          <Link className="group min-h-64 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 transition hover:border-red-500/60 focus-visible:outline-2 focus-visible:outline-red-500" href="/cars?condition=USED">
            <p className="text-sm font-bold tracking-[0.2em] text-red-400">MOBIL BEKAS</p><h2 className="mt-4 text-3xl font-black text-white">Banyak pilihan, tetap praktis.</h2><p className="mt-3 max-w-md text-zinc-400">Bandingkan informasi kendaraan bekas secara jelas sebelum menghubungi dealer.</p><span className="mt-8 inline-flex font-bold text-white group-hover:text-red-400">Lihat Mobil Bekas →</span>
          </Link>
        </div>
      </PageContainer></section>

      <section className="border-y border-white/10 bg-zinc-950 py-20"><PageContainer>
        <SectionHeading copy="Kendaraan tersedia yang sedang menjadi pilihan utama dealer." eyebrow="Pilihan unggulan" title="Mobil Pilihan Untuk Anda" />
        {featuredCars.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredCars.map((car) => <VehicleCard car={car} key={car.id} />)}</div> : <EmptyInventory message="Belum ada mobil unggulan yang ditampilkan saat ini." />}
      </PageContainer></section>

      <section className="py-20"><PageContainer>
        <SectionHeading eyebrow="Jelajahi merek" title="Cari Berdasarkan Merek" />
        {brands.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{brands.map((brand) => <Link className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-6 text-center transition hover:border-red-500/60 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-red-500" href={`/cars?brand=${brand.slug}`} key={brand.slug}><span className="block text-lg font-black text-white">{brand.name}</span><span className="mt-2 block text-xs text-zinc-500">{brand.availableCars} tersedia</span></Link>)}</div> : <div className="rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-zinc-400">Merek kendaraan akan tampil setelah data tersedia.</div>}
      </PageContainer></section>

      <section className="border-y border-white/10 bg-zinc-950 py-20"><PageContainer>
        <div className="flex flex-wrap items-end justify-between gap-5"><SectionHeading copy="Pilihan kendaraan tersedia yang terakhir diperbarui." eyebrow="Baru diperbarui" title="Mobil Tersedia Terbaru" /><Link className="mb-8 font-bold text-red-400 hover:text-red-300" href="/cars">Lihat Semua Mobil →</Link></div>
        {latestCars.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{latestCars.map((car) => <VehicleCard car={car} key={car.id} />)}</div> : <EmptyInventory message="Belum ada kendaraan tersedia terbaru untuk ditampilkan." />}
      </PageContainer></section>

      <section className="py-20"><PageContainer>
        <SectionHeading eyebrow="Mengapa memilih kami" title="Lebih Mudah Menemukan Pilihan Anda" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([number, title, copy]) => <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6" key={number}><span className="text-sm font-bold text-red-400">{number}</span><h3 className="mt-5 text-lg font-bold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{copy}</p></article>)}</div>
      </PageContainer></section>

      <section className="pb-20" id="contact"><PageContainer>
        <div className="rounded-3xl bg-red-600 p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-red-100">{dealer.dealerName}</p><h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Siap menemukan mobil pilihan Anda?</h2><p className="mt-4 max-w-2xl text-red-100">Hubungi dealer untuk informasi kendaraan dan langkah berikutnya.</p><div className="mt-5 flex flex-wrap gap-4 text-sm text-white">{dealer.phone ? <span>{dealer.phone}</span> : null}{dealer.email ? <a href={`mailto:${dealer.email}`}>{dealer.email}</a> : null}{dealer.address ? <span>{dealer.address}</span> : null}</div></div>
          <div className="mt-8 lg:mt-0">{whatsappUrl ? <a className="inline-flex min-h-12 items-center rounded-xl bg-white px-6 font-bold text-red-700 hover:bg-red-50" href={whatsappUrl} rel="noreferrer" target="_blank">Chat via WhatsApp</a> : <Link className="inline-flex min-h-12 items-center rounded-xl bg-white px-6 font-bold text-red-700 hover:bg-red-50" href="/cars">Jelajahi Mobil</Link>}</div>
        </div>
      </PageContainer></section>
    </>
  );
}
