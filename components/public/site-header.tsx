import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";
import { STOREFRONT_MOBILE_NAV, storefrontHeaderColor } from "@/features/theme/domain";
import { WhatsAppLink } from "./whatsapp-link";

import { publicNavigation as links } from "./navigation";

function Brand({ dealer }: { dealer: DealerPresentation }) {
  return (
    <Link aria-label={`${dealer.dealerName} — beranda`} className="flex min-w-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-white" href="/">
      {dealer.logoUrl ? <span className="rounded-md bg-white px-2 py-1"><Image alt="" className="h-9 w-auto max-w-[10.5rem] object-contain sm:h-10 sm:max-w-[12rem]" height={44} src={dealer.logoUrl} unoptimized={shouldBypassImageOptimization(dealer.logoUrl)} width={180} /></span> : <span className="truncate font-public-display text-sm font-extrabold tracking-[0.08em] text-white sm:text-base">{dealer.dealerName}</span>}
    </Link>
  );
}

export function SiteHeader({ dealer }: { dealer: DealerPresentation }) {
  const whatsappUrl = createWhatsappUrl(dealer.whatsappNumber);
  const headerColor = storefrontHeaderColor(dealer.primaryColor);
  return (
    <header className="sticky top-0 z-50 border-b border-black/20 text-white shadow-[0_2px_12px_rgba(25,32,31,0.12)]" style={{ backgroundColor: headerColor }}>
      <PageContainer className="flex min-h-16 items-center justify-between gap-4 py-2.5">
        <Brand dealer={dealer} />
        <nav aria-label="Navigasi utama" className="hidden xl:block">
          <ul className="flex items-center gap-5 text-xs font-bold tracking-wide text-white/85">
            {links.map((link) => <li key={link.href}><Link className="rounded-sm border-b-2 border-transparent py-2 transition hover:border-white hover:text-white focus-visible:outline-2 focus-visible:outline-white" href={link.href}>{link.label}</Link></li>)}
          </ul>
        </nav>
        <div className="hidden xl:block">
          {whatsappUrl ? <WhatsAppLink aria-label={`Chat dengan ${dealer.dealerName} via WhatsApp`} href={whatsappUrl} variant="header">Chat via WhatsApp</WhatsAppLink> : <Link className="inline-flex min-h-10 items-center rounded-md border border-white/60 px-4 text-xs font-extrabold uppercase tracking-[0.08em] text-white transition-colors focus-visible:outline-2 focus-visible:outline-white hover:bg-white hover:text-[#171717]" href="/contact">Kontak Dealer</Link>}
        </div>
        <details className="group relative xl:hidden">
          <summary aria-label="Buka menu navigasi" className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-md border border-white/35 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white">
            <span aria-hidden="true" className="text-lg leading-none group-open:hidden">☰</span><span aria-hidden="true" className="hidden text-2xl leading-none group-open:inline">×</span>
          </summary>
          <div className="absolute right-0 top-[calc(100%+0.75rem)] max-h-[calc(100dvh-5.5rem)] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-white/10 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.32)]" style={{ backgroundColor: STOREFRONT_MOBILE_NAV }}><nav aria-label="Navigasi seluler">
            <ul className="grid divide-y divide-white/8">
              {links.map((link) => <li key={link.href}><Link className="flex min-h-11 items-center rounded-md px-3 py-2.5 text-sm font-semibold text-white/90 transition-colors focus-visible:outline-2 focus-visible:outline-white hover:bg-white/7 hover:text-white" href={link.href}>{link.label}</Link></li>)}
            </ul></nav>
              <div className="mt-2 border-t border-white/10 pt-2">{whatsappUrl ? <WhatsAppLink href={whatsappUrl} variant="menu">Chat via WhatsApp</WhatsAppLink> : <Link className="flex min-h-11 items-center rounded-md border border-white/25 px-3 text-sm font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-white hover:bg-white/7" href="/contact">Kontak Dealer</Link>}</div>
          </div>
        </details>
      </PageContainer>
    </header>
  );
}
