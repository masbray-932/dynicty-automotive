"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNavigation } from "./navigation";
export function PublicNav({mobile=false}:{mobile?:boolean}){const path=usePathname()??"/";return <nav aria-label={mobile?"Navigasi seluler":"Navigasi utama"}><ul className={mobile?"grid divide-y divide-[#E5E5E5]":"flex items-center justify-center gap-7 text-sm font-bold"}>{publicNavigation.map(link=>{const active=link.href==="/"?path==="/":path.startsWith(link.href);return <li key={link.href}><Link aria-current={active?"page":undefined} className={mobile?`flex min-h-11 items-center rounded-md px-3 py-2.5 text-sm font-semibold ${active?"text-[#C8102E]":"text-[#303030]"}`:`inline-flex min-h-11 items-center border-b-2 px-1 transition ${active?"border-[#C8102E] text-[#C8102E]":"border-transparent text-[#303030] hover:border-[#C8102E]/40 hover:text-[#C8102E]"}`} href={link.href}>{link.label}</Link></li>;})}</ul></nav>}
