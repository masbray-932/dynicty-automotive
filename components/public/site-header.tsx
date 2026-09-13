import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/cars?condition=NEW", label: "Mobil Baru" },
  { href: "/cars?condition=USED", label: "Mobil Bekas" },
  { href: "/#contact", label: "Kontak" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <PageContainer className="flex min-h-18 flex-wrap items-center justify-between gap-4 py-4">
        <Link className="text-lg font-black tracking-tight text-white focus-visible:outline-2 focus-visible:outline-red-500" href="/">
          DYNICTY <span className="text-red-500">AUTOMOTIVE</span>
        </Link>
        <nav aria-label="Navigasi utama">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-300">
            {links.map((link) => (
              <li key={link.href}>
                <Link className="rounded-md transition hover:text-white focus-visible:outline-2 focus-visible:outline-red-500" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageContainer>
    </header>
  );
}
