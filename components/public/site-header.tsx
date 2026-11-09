import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";

import { publicNavigation as links } from "./navigation";

function Brand({ dealer }: { dealer: DealerPresentation }) {
  return (
    <Link className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-brand-focus" href="/">
      {dealer.logoUrl ? <Image alt={`Logo ${dealer.dealerName}`} className="h-10 w-10 rounded-lg object-contain" height={40} src={dealer.logoUrl} unoptimized={shouldBypassImageOptimization(dealer.logoUrl)} width={40} /> : <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-primary text-lg font-black text-brand-on-primary">D</span>}
      <span className="truncate font-public-display text-sm font-extrabold tracking-[0.08em] text-[#171717] sm:text-base">{dealer.dealerName}</span>
    </Link>
  );
}

export function SiteHeader({ dealer }: { dealer: DealerPresentation }) {
  const whatsappUrl = createWhatsappUrl(dealer.whatsappNumber);
  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-xl">
      <PageContainer className="flex min-h-18 items-center justify-between gap-4 py-3">
        <Brand dealer={dealer} />
        <nav aria-label="Navigasi utama" className="hidden xl:block">
          <ul className="flex items-center gap-5 text-xs font-bold tracking-wide text-[#606060]">
            {links.map((link) => <li key={link.href}><Link className="rounded-sm border-b-2 border-transparent py-2 transition hover:border-[#C8102E] hover:text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus" href={link.href}>{link.label}</Link></li>)}
          </ul>
        </nav>
        <div className="hidden xl:block">
          {whatsappUrl ? <a className="inline-flex min-h-11 items-center rounded bg-brand-primary px-5 text-xs font-extrabold uppercase tracking-wider text-brand-on-primary transition hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus" href={whatsappUrl} rel="noopener noreferrer" target="_blank">Hubungi Kami</a> : <Link className="inline-flex min-h-11 items-center rounded border border-[#171717] px-5 text-xs font-extrabold uppercase tracking-wider text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus hover:bg-[#171717] hover:text-white" href="/contact">Hubungi Kami</Link>}
        </div>
        <details className="group relative xl:hidden">
          <summary aria-label="Buka menu navigasi" className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded border border-[#E5E5E5] text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus">
            <span aria-hidden="true" className="text-xl group-open:hidden">☰</span><span aria-hidden="true" className="hidden text-xl group-open:inline">×</span>
          </summary>
          <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-lg border border-[#E5E5E5] bg-white p-2 shadow-2xl"><nav aria-label="Navigasi seluler">
            <ul className="grid">
              {links.map((link) => <li key={link.href}><Link className="block min-h-11 rounded px-4 py-3 text-sm font-semibold text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus hover:bg-[#F6F6F6]" href={link.href}>{link.label}</Link></li>)}
            </ul></nav>
              {whatsappUrl ? <div className="mt-2"><a className="block min-h-11 rounded bg-brand-primary px-4 py-3 text-center text-sm font-bold text-brand-on-primary focus-visible:outline-2 focus-visible:outline-brand-focus" href={whatsappUrl} rel="noopener noreferrer" target="_blank">WhatsApp</a></div> : null}
          </div>
        </details>
      </PageContainer>
    </header>
  );
}
