"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/server/auth/actions";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cars", label: "Kelola Mobil" },
  { href: "/admin/brands", label: "Merek & Model" },
  { href: "/admin/services", label: "Layanan" },
  { href: "/admin/articles", label: "Artikel" },
  { href: "/admin/sales-team", label: "Tim Sales" },
  { href: "/admin/content", label: "Konten Website" },
  { href: "/admin/settings", label: "Pengaturan" },
  { href: "/", label: "Lihat Website" },
];

export function AdminNav() {
  const pathname = usePathname();
  const active = (href: string) => href === "/" ? pathname === "/" : href === "/admin" ? pathname === href : pathname.startsWith(href);
  return (
    <aside className="border-b border-white/10 bg-zinc-950 p-3 lg:sticky lg:top-0 lg:min-h-screen lg:w-64 lg:self-start lg:border-b-0 lg:border-r lg:p-4">
      <div className="flex items-center justify-between gap-3"><p className="text-sm font-black tracking-wide text-white">DYNICTY ADMIN</p><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Aman</span></div>
      <nav aria-label="Navigasi admin" className="mt-3">
        <ul className="flex snap-x gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {links.map((link) => (
            <li className="shrink-0 snap-start lg:shrink" key={link.href}>
              <Link aria-current={active(link.href) ? "page" : undefined} className={`block min-h-11 rounded-xl px-3 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-brand-focus ${active(link.href) ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"}`} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <form action={logoutAction}>
              <button className="min-h-11 rounded-xl px-3 py-3 text-left text-sm text-red-300 hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-red-400" type="submit">
                Keluar
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
