import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";
import { storefrontHeaderColor } from "@/features/theme/domain";
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
    <header className="sticky top-0 z-50 border-b border-white/15 text-white shadow-sm" style={{ backgroundColor: headerColor }}>
      <PageContainer className="flex min-h-18 items-center justify-between gap-4 py-3">
        <Brand dealer={dealer} />
        <nav aria-label="Navigasi utama" className="hidden xl:block">
          <ul className="flex items-center gap-5 text-xs font-bold tracking-wide text-white/85">
            {links.map((link) => <li key={link.href}><Link className="rounded-sm border-b-2 border-transparent py-2 transition hover:border-white hover:text-white focus-visible:outline-2 focus-visible:outline-white" href={link.href}>{link.label}</Link></li>)}
          </ul>
        </nav>
        <div className="hidden xl:block">
          {whatsappUrl ? <WhatsAppLink aria-label={`Chat dengan ${dealer.dealerName} via WhatsApp`} className="text-xs font-extrabold uppercase tracking-wider" href={whatsappUrl}>Chat via WhatsApp</WhatsAppLink> : <Link className="inline-flex min-h-11 items-center rounded border border-white/70 px-5 text-xs font-extrabold uppercase tracking-wider text-white focus-visible:outline-2 focus-visible:outline-white hover:bg-white hover:text-[#171717]" href="/contact">Kontak Dealer</Link>}
        </div>
        <details className="group relative xl:hidden">
          <summary aria-label="Buka menu navigasi" className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded border border-white/40 text-white focus-visible:outline-2 focus-visible:outline-white">
            <span aria-hidden="true" className="text-xl group-open:hidden">☰</span><span aria-hidden="true" className="hidden text-xl group-open:inline">×</span>
          </summary>
          <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-lg border border-white/20 p-2 shadow-2xl" style={{ backgroundColor: headerColor }}><nav aria-label="Navigasi seluler">
            <ul className="grid">
              {links.map((link) => <li key={link.href}><Link className="block min-h-11 rounded px-4 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-white hover:bg-white/10" href={link.href}>{link.label}</Link></li>)}
            </ul></nav>
              <div className="mt-2">{whatsappUrl ? <WhatsAppLink className="flex px-4 py-3 text-center text-sm" href={whatsappUrl}>Chat via WhatsApp</WhatsAppLink> : <Link className="block min-h-11 rounded border border-white/70 px-4 py-3 text-center text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-white" href="/contact">Kontak Dealer</Link>}</div>
          </div>
        </details>
      </PageContainer>
    </header>
  );
}
