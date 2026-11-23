"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { homepagePaginationItems } from "@/features/homepage/domain";

function pageHref(page: number) {
  return page === 1 ? "/#inventory" : `/?stockPage=${page}#inventory`;
}

export function HomepageInventoryFooter({ page, totalPages }: { page: number; totalPages: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const href = event.currentTarget.getAttribute("href");
    if (href) startTransition(() => { router.push(href); });
  };
  const linkClass = "grid min-h-11 min-w-11 place-items-center rounded border border-[#D4D4D4] px-3 text-sm font-bold text-[#171717] transition hover:border-[#171717] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus";
  return <div className="mt-9">
    {totalPages > 1 ? <nav aria-label="Halaman stok mobil" aria-busy={pending} className="flex justify-end overflow-x-auto pb-2">
      <div className="flex items-center gap-2">
        {page > 1 ? <Link className={linkClass} href={pageHref(page - 1)} onClick={navigate}>Previous</Link> : <span aria-disabled="true" className={`${linkClass} cursor-not-allowed opacity-40`}>Previous</span>}
        {homepagePaginationItems(page, totalPages).map((item, index) => item === "ellipsis"
          ? <span aria-hidden="true" className="px-1 text-[#606060]" key={`ellipsis-${index}`}>…</span>
          : item === page
            ? <span aria-current="page" className={`${linkClass} border-black bg-black text-white`} key={item}>{item}</span>
            : <Link className={linkClass} href={pageHref(item)} key={item} onClick={navigate}>{item}</Link>)}
        {page < totalPages ? <Link className={linkClass} href={pageHref(page + 1)} onClick={navigate}>Next</Link> : <span aria-disabled="true" className={`${linkClass} cursor-not-allowed opacity-40`}>Next</span>}
      </div>
    </nav> : null}
    <p aria-live="polite" className="h-5 text-right text-xs text-[#606060]">{pending ? "Memuat stok mobil…" : ""}</p>
    <hr className="mt-3 border-[#D4D4D4]" />
    <div className="mt-7 flex justify-center"><Link className="min-h-11 rounded px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-[#C8102E] focus-visible:outline-2 focus-visible:outline-brand-focus" href="/cars">Lihat Semua Mobil →</Link></div>
  </div>;
}
