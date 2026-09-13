import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/cars?condition=NEW", label: "Mobil Baru" },
  { href: "/cars?condition=USED", label: "Mobil Bekas" },
  { href: "/cars", label: "Semua Mobil" },
  { href: "/#contact", label: "Kontak" },
];

function Brand({ dealer }: { dealer: DealerPresentation }) {
  return (
    <Link className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-red-500" href="/">
      {dealer.logoUrl ? <Image alt={`Logo ${dealer.dealerName}`} className="h-10 w-10 rounded-lg object-contain" height={40} src={dealer.logoUrl} unoptimized width={40} /> : <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-lg font-black text-white">D</span>}
      <span className="truncate text-sm font-black tracking-tight text-white sm:text-base">{dealer.dealerName}</span>
    </Link>
  );
}

export function SiteHeader({ dealer }: { dealer: DealerPresentation }) {
  const whatsappUrl = createWhatsappUrl(dealer.whatsappNumber);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <PageContainer className="flex min-h-18 items-center justify-between gap-4 py-3">
        <Brand dealer={dealer} />
        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-6 text-sm font-medium text-zinc-300">
            {links.map((link) => <li key={link.href}><Link className="rounded-md transition hover:text-white focus-visible:outline-2 focus-visible:outline-red-500" href={link.href}>{link.label}</Link></li>)}
          </ul>
        </nav>
        <div className="hidden lg:block">
          {whatsappUrl ? <a className="inline-flex min-h-11 items-center rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500" href={whatsappUrl} rel="noreferrer" target="_blank">Hubungi Kami</a> : <Link className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/10" href="/#contact">Hubungi Kami</Link>}
        </div>
        <details className="group relative lg:hidden">
          <summary aria-label="Buka menu navigasi" className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-xl border border-white/15 text-white focus-visible:outline-2 focus-visible:outline-red-500">
            <span aria-hidden="true" className="text-xl group-open:hidden">☰</span><span aria-hidden="true" className="hidden text-xl group-open:inline">×</span>
          </summary>
          <nav aria-label="Navigasi seluler" className="absolute right-0 top-14 w-64 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-2xl">
            <ul className="grid">
              {links.map((link) => <li key={link.href}><Link className="block min-h-11 rounded-xl px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-red-500" href={link.href}>{link.label}</Link></li>)}
              {whatsappUrl ? <li className="mt-2"><a className="block min-h-11 rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-bold text-white" href={whatsappUrl} rel="noreferrer" target="_blank">WhatsApp</a></li> : null}
            </ul>
          </nav>
        </details>
      </PageContainer>
    </header>
  );
}
