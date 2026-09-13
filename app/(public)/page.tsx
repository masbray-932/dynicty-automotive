import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";

export default function HomePage() {
  return (
    <PageContainer className="py-16 sm:py-24">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Badge>Phase 0 Foundation</Badge>
          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
            Fondasi digital premium untuk dealer mobil modern.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Shell publik, arsitektur data, keamanan admin, dan sistem media telah disiapkan. Homepage final akan dibangun pada fase berikutnya.
          </p>
          <Link className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500" href="/cars">
            Lihat fondasi katalog
          </Link>
        </div>
        <Card className="overflow-hidden bg-gradient-to-br from-red-600/20 via-zinc-900 to-black">
          <p className="text-sm uppercase tracking-[0.2em] text-red-300">Basic Dealer</p>
          <p className="mt-8 text-3xl font-bold text-white">New & Used Cars</p>
          <p className="mt-3 text-zinc-400">Bukan marketplace. Satu dealer, satu identitas, dan alur penjualan yang fokus.</p>
        </Card>
      </section>
    </PageContainer>
  );
}
