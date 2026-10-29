import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";
import type { getPublicDealerContent } from "@/server/content/service";
import { visibleItems } from "./domain";
type Content = Awaited<ReturnType<typeof getPublicDealerContent>>;
export function AboutSection({content,full=false}:{content:Content;full?:boolean}) {
  const profile=content.profile;
  if(!profile?.aboutActive || !(full?profile.aboutStory:profile.aboutSummary).trim()) return null;
  return <section className="py-12"><PageContainer className="grid gap-8 md:grid-cols-2 md:items-center"><div><h2 className="text-3xl font-bold">Tentang Kami</h2><p className="mt-5 whitespace-pre-line leading-8 text-zinc-300">{full?profile.aboutStory:profile.aboutSummary}</p>{!full?<Link href="/about" className="mt-5 inline-flex min-h-11 items-center font-semibold text-red-300 focus-visible:outline-2 focus-visible:outline-white">Kenali dealer kami →</Link>:null}</div>{content.showroomUrl?<div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image fill src={content.showroomUrl} alt={profile.showroomAlt} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" unoptimized={shouldBypassImageOptimization(content.showroomUrl)} /></div>:null}</PageContainer></section>;
}
export function AdvantagesSection({content}:{content:Content}) {
  const items=visibleItems(content.items,"ADVANTAGE"); if(!items.length)return null;
  return <section className="py-12"><PageContainer><h2 className="text-3xl font-bold">Kenapa Memilih Kami</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><article key={item.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-6"><h3 className="text-xl font-semibold">{item.title}</h3><p className="mt-3 whitespace-pre-line leading-7 text-zinc-300">{item.body}</p></article>)}</div></PageContainer></section>;
}
export function LeasingSection({content}:{content:Content}) {
  const items=visibleItems(content.items,"LEASING_PARTNER");if(!items.length)return null;
  return <section className="py-12"><PageContainer><h2 className="text-3xl font-bold">Partner Leasing</h2><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{items.map(item=>{const logo=<Image src={item.mediaUrl!} alt={item.title} width={180} height={90} sizes="(max-width: 768px) 45vw, 180px" className="h-24 w-full object-contain p-3" unoptimized={shouldBypassImageOptimization(item.mediaUrl!)} />;return <div key={item.id} className="rounded-xl bg-white">{item.link?<Link href={item.link} {...(item.link.startsWith("https:")?{target:"_blank",rel:"noopener noreferrer"}:{})} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-red-400">{logo}</Link>:logo}</div>;})}</div></PageContainer></section>;
}
export function FaqSection({content}:{content:Content}) {
  const items=visibleItems(content.items,"FAQ");if(!items.length)return null;
  return <section className="py-12"><PageContainer><h2 className="text-3xl font-bold">Pertanyaan yang Sering Diajukan</h2><div className="mt-6 grid gap-3">{items.map(item=><details key={item.id} className="rounded-xl border border-white/15 p-5"><summary className="min-h-11 cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-red-400">{item.title}</summary><p className="mt-4 whitespace-pre-line leading-7 text-zinc-300">{item.body}</p></details>)}</div></PageContainer></section>;
}
export function DealerContact({dealer,hours}:{dealer:DealerPresentation;hours?:string}) {
  const wa=createWhatsappUrl(dealer.whatsappNumber);
  return <section className="py-12" id="contact"><PageContainer><div className="grid gap-6 rounded-2xl border border-white/15 bg-zinc-900 p-6 sm:p-10 lg:grid-cols-2"><div><h2 className="text-3xl font-bold">Hubungi {dealer.dealerName}</h2><div className="mt-5 grid gap-3 text-zinc-300">{dealer.address?<p className="whitespace-pre-line">{dealer.address}</p>:null}{dealer.phone?<a className="w-fit min-h-11 py-2 focus-visible:outline-2 focus-visible:outline-brand-focus" href={`tel:${dealer.phone.replace(/[^+\d]/g,"")}`}>{dealer.phone}</a>:null}{dealer.email?<a className="w-fit min-h-11 break-all py-2 focus-visible:outline-2 focus-visible:outline-brand-focus" href={`mailto:${dealer.email}`}>{dealer.email}</a>:null}{dealer.googleMapsUrl?<a className="w-fit min-h-11 py-2 text-red-300 focus-visible:outline-2 focus-visible:outline-brand-focus" href={dealer.googleMapsUrl} target="_blank" rel="noopener noreferrer">Lihat lokasi showroom</a>:null}</div></div><div>{hours?.trim()?<><h3 className="font-bold">Jam Operasional</h3><p className="mt-3 whitespace-pre-line text-zinc-300">{hours}</p></>:null}<div className="mt-5 flex flex-wrap gap-3">{wa?<a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-brand-primary px-5 font-bold text-brand-on-primary focus-visible:outline-2 focus-visible:outline-brand-focus">Chat WhatsApp</a>:null}<Link href="/cars" className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 font-bold focus-visible:outline-2 focus-visible:outline-brand-focus">Lihat Katalog</Link></div></div></div></PageContainer></section>;
}
