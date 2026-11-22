import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";
import { WhatsAppLink } from "./whatsapp-link";
import { HeaderVehicleSearch } from "./header-vehicle-search";
import { PublicNav } from "./public-nav";

function Brand({ dealer }: { dealer: DealerPresentation }) {
  return (
    <Link aria-label={`${dealer.dealerName} — beranda`} className="flex min-w-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-[#C8102E]" href="/">
      {dealer.logoUrl ? <Image alt="" className="h-10 w-auto max-w-[11rem] object-contain sm:h-12 sm:max-w-[13rem]" height={48} src={dealer.logoUrl} unoptimized={shouldBypassImageOptimization(dealer.logoUrl)} width={200} /> : <span className="truncate font-public-display text-sm font-extrabold tracking-[0.08em] text-[#171717] sm:text-base">{dealer.dealerName}</span>}
    </Link>
  );
}

export function SiteHeader({ dealer }: { dealer: DealerPresentation }) {
  const whatsappUrl = createWhatsappUrl(dealer.whatsappNumber);
  const inventoryMode=dealer.inventoryMode??"BOTH";
  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-white text-[#171717] shadow-[0_2px_12px_rgba(23,23,23,0.08)]">
      <PageContainer className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 lg:grid-cols-[auto_minmax(18rem,42rem)_auto] lg:gap-6">
        <Brand dealer={dealer} /><div className="order-3 col-span-2 lg:order-none lg:col-span-1"><HeaderVehicleSearch inventoryMode={inventoryMode}/></div><div className="hidden lg:block">
          {whatsappUrl ? <WhatsAppLink aria-label={`Chat dengan ${dealer.dealerName} via WhatsApp`} href={whatsappUrl} variant="header">Chat via WhatsApp</WhatsAppLink> : <Link className="inline-flex min-h-11 items-center rounded-md border border-[#D7D7D7] px-4 text-xs font-extrabold uppercase tracking-[0.08em] text-[#171717] transition-colors hover:border-[#C8102E] hover:text-[#C8102E] focus-visible:outline-2 focus-visible:outline-[#C8102E]" href="/contact">Kontak Dealer</Link>}
        </div>
        <details className="group relative justify-self-end lg:hidden">
          <summary aria-label="Buka menu navigasi" className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-md border border-[#D7D7D7] text-[#171717] hover:bg-[#F6F6F6] focus-visible:outline-2 focus-visible:outline-[#C8102E]">
            <span aria-hidden="true" className="text-lg leading-none group-open:hidden">☰</span><span aria-hidden="true" className="hidden text-2xl leading-none group-open:inline">×</span>
          </summary>
          <div className="absolute right-0 top-[calc(100%+0.75rem)] max-h-[calc(100dvh-8rem)] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-[#E5E5E5] bg-white p-2 shadow-[0_18px_48px_rgba(0,0,0,0.18)]"><PublicNav mobile/>
              <div className="mt-2 border-t border-[#E5E5E5] pt-2">{whatsappUrl ? <WhatsAppLink href={whatsappUrl} variant="menu">Chat via WhatsApp</WhatsAppLink> : <Link className="flex min-h-11 items-center rounded-md border border-[#D7D7D7] px-3 text-sm font-bold text-[#171717]" href="/contact">Kontak Dealer</Link>}</div>
          </div>
        </details>
      </PageContainer>
      <div className="hidden border-t border-[#EFEFEF] lg:block"><PageContainer><PublicNav/></PageContainer></div>
    </header>
  );
}
