import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import type { DealerPresentation } from "@/features/homepage/domain";

export function SiteFooter({ dealer }: { dealer: DealerPresentation }) {
  return (
    <footer className="border-t border-white/10 bg-black py-10">
      <PageContainer className="grid gap-8 text-sm text-zinc-400 sm:grid-cols-2 lg:grid-cols-3">
        <div><p className="font-bold text-white">{dealer.dealerName}</p><p className="mt-2 max-w-sm">Pilihan mobil baru dan bekas dalam satu pengalaman dealer yang praktis.</p></div>
        <nav aria-label="Navigasi footer"><p className="font-bold text-white">Jelajahi</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2"><Link href="/cars?condition=NEW">Mobil Baru</Link><Link href="/cars?condition=USED">Mobil Bekas</Link><Link href="/cars">Semua Mobil</Link></div></nav>
        <div className="lg:text-right"><p>© {new Date().getFullYear()} {dealer.dealerName}.</p><p className="mt-2">Informasi kendaraan dapat berubah. Hubungi dealer untuk konfirmasi.</p></div>
      </PageContainer>
    </footer>
  );
}
