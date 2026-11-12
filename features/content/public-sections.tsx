import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";
import type { getPublicDealerContent } from "@/server/content/service";
import { TestimonialCarousel } from "./testimonial-carousel";
import { DEFAULT_ADVANTAGES, advantageIconFromToken, advantageIconToken, isAdvantageSectionItem, visibleItems, type AdvantageIconKey, type PublicContentItem } from "./domain";
type ContentResult = Awaited<ReturnType<typeof getPublicDealerContent>>;
type Content = Pick<ContentResult,"profile"|"showroomUrl"|"items"> & Partial<Pick<ContentResult,"advantageConfigured"|"advantageSection">>;
export function AboutSection({content,full=false}:{content:Content;full?:boolean}) {
  const profile=content.profile;
  if(!profile?.aboutActive || !(full?profile.aboutStory:profile.aboutSummary).trim()) return null;
  return <section className="public-section bg-[#F6F6F6]"><PageContainer className="grid gap-10 md:grid-cols-2 md:items-center"><div><p className="public-eyebrow">Profil Showroom</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{full?"Tentang Kami":"Sekilas Tentang Kami"}</h2><p className="mt-5 whitespace-pre-line leading-8 text-[#606060]">{full?profile.aboutStory:profile.aboutSummary}</p>{!full?<Link href="/about" className="mt-6 inline-flex min-h-11 items-center text-xs font-extrabold uppercase tracking-wider text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus">Kenali dealer kami →</Link>:null}</div>{content.showroomUrl?<div className="relative aspect-[4/3] overflow-hidden rounded-lg"><Image fill src={content.showroomUrl} alt={profile.showroomAlt} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" unoptimized={shouldBypassImageOptimization(content.showroomUrl)} /></div>:null}</PageContainer></section>;
}
function AdvantageIcon({ icon }: { icon: AdvantageIconKey }) {
  const common={className:"h-7 w-7",fill:"none",viewBox:"0 0 24 24","aria-hidden":true,stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  if(icon==="quality")return <svg {...common}><path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3Z"/></svg>;
  if(icon==="transparent")return <svg {...common}><path d="M3 12s3.3-5 9-5 9 5 9 5-3.3 5-9 5-9-5-9-5Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  if(icon==="professional")return <svg {...common}><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7M4 8h16v11H4z"/><path d="M4 12h16M10 12v2h4v-2"/></svg>;
  if(icon==="easy")return <svg {...common}><path d="M4 12h11M11 8l4 4-4 4"/><path d="M15 5h5v14h-5"/></svg>;
  if(icon==="consultation")return <svg {...common}><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>;
  return <svg {...common}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/><path d="m9 12 2 2 4-4"/></svg>;
}
export function AdvantagesSection({content,dealerName,defaultContent=false}:{content:Content;dealerName?:string;defaultContent?:boolean}) {
  if(content.advantageSection?.active===false)return null;
  const configured=content.advantageConfigured ?? content.items.some(item=>item.kind==="ADVANTAGE"&&!isAdvantageSectionItem(item));
  const configuredItems=visibleItems(content.items,"ADVANTAGE").filter(item=>!isAdvantageSectionItem(item));
  const defaults:PublicContentItem[]=DEFAULT_ADVANTAGES.map((item,index)=>({id:`default-advantage-${index}`,kind:"ADVANTAGE",title:item.title,body:item.body,link:advantageIconToken(item.icon),active:true,sortOrder:index+1,mediaUrl:null}));
  const items=configuredItems.length?configuredItems:!configured&&defaultContent?defaults:[]; if(!items.length)return null;
  const title=content.advantageSection?.title?.trim() || `Mengapa Memilih ${dealerName?.trim()||"Kami"}?`;
  return <section className="public-section" aria-labelledby="advantages-title"><PageContainer><ScrollReveal><p className="public-eyebrow">Nilai Kami</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" id="advantages-title">{title}</h2></ScrollReveal><div className="mt-8 grid gap-4 md:grid-cols-2">{items.slice(0,6).map((item,index)=>{const icon=advantageIconFromToken(item.link)??DEFAULT_ADVANTAGES[index%DEFAULT_ADVANTAGES.length].icon;return <ScrollReveal className="h-full" delay={index*45} key={item.id}><article className="group flex h-full gap-4 rounded-lg border border-[#E5E5E5] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#C8102E]/40 hover:shadow-lg sm:p-6"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FCECEF] text-[#C8102E] transition group-hover:bg-[#C8102E] group-hover:text-white"><AdvantageIcon icon={icon}/></div><div><h3 className="text-lg font-bold text-[#171717] sm:text-xl">{item.title}</h3><p className="mt-2 whitespace-pre-line leading-7 text-[#606060]">{item.body}</p></div></article></ScrollReveal>;})}</div></PageContainer></section>;
}
export function LeasingSection({content}:{content:Content}) {
  const items=visibleItems(content.items,"LEASING_PARTNER");if(!items.length)return null;
  return <section className="public-section border-y border-[#E5E5E5] bg-[#F6F6F6]"><PageContainer><p className="public-eyebrow">Kolaborasi</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Partner Leasing</h2><div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{items.map(item=>{const logo=<Image src={item.mediaUrl!} alt={item.title} width={180} height={90} sizes="(max-width: 768px) 45vw, 180px" className="h-24 w-full object-contain p-3" unoptimized={shouldBypassImageOptimization(item.mediaUrl!)} />;return <div key={item.id} className="rounded border border-[#E5E5E5] bg-white">{item.link?<Link href={item.link} {...(item.link.startsWith("https:")?{target:"_blank",rel:"noopener noreferrer"}:{})} className="block rounded focus-visible:outline-2 focus-visible:outline-brand-focus">{logo}</Link>:logo}<p className="px-3 pb-3 text-center text-sm text-[#606060]">{item.title}</p></div>;})}</div></PageContainer></section>;
}
export function FaqSection({content}:{content:Content}) {
  const items=visibleItems(content.items,"FAQ");if(!items.length)return null;
  return <section className="public-section"><PageContainer className="max-w-5xl"><p className="public-eyebrow">Informasi</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Pertanyaan yang Sering Diajukan</h2><div className="mt-8 grid gap-3">{items.map(item=><details key={item.id} className="rounded border border-[#E5E5E5] bg-white p-5"><summary className="min-h-11 cursor-pointer font-semibold text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus">{item.title}</summary><p className="mt-4 whitespace-pre-line leading-7 text-[#606060]">{item.body}</p></details>)}</div></PageContainer></section>;
}
export function DealerContact({dealer,hours}:{dealer:DealerPresentation;hours?:string}) {
  const wa=createWhatsappUrl(dealer.whatsappNumber);
  return <section className="public-section bg-[#F6F6F6]" id="contact"><PageContainer><div className="grid gap-10 rounded-lg border border-[#E5E5E5] bg-white p-6 sm:p-10 lg:grid-cols-2"><div><p className="public-eyebrow">Kunjungi Kami</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Kontak &amp; Lokasi</h2><p className="mt-3 text-[#606060]">Hubungi {dealer.dealerName}</p><div className="mt-5 grid gap-3 text-[#606060]">{dealer.address?<p className="whitespace-pre-line">{dealer.address}</p>:null}{dealer.phone?<a className="w-fit min-h-11 py-2 font-semibold text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus" href={`tel:${dealer.phone.replace(/[^+\d]/g,"")}`}>{dealer.phone}</a>:null}{dealer.email?<a className="w-fit min-h-11 break-all py-2 font-semibold text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus" href={`mailto:${dealer.email}`}>{dealer.email}</a>:null}{dealer.googleMapsUrl?<a className="w-fit min-h-11 py-2 font-semibold text-[#C8102E] focus-visible:outline-2 focus-visible:outline-brand-focus" href={dealer.googleMapsUrl} target="_blank" rel="noopener noreferrer">Lihat lokasi showroom</a>:null}</div></div><div>{hours?.trim()?<><h3 className="font-bold text-[#171717]">Jam Operasional</h3><p className="mt-3 whitespace-pre-line text-[#606060]">{hours}</p></>:null}<div className="mt-6 flex flex-wrap gap-3">{wa?<a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded bg-brand-primary px-5 font-bold text-brand-on-primary focus-visible:outline-2 focus-visible:outline-brand-focus">Chat WhatsApp</a>:null}<Link href="/cars" className="inline-flex min-h-11 items-center rounded border border-[#171717] px-5 font-bold text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus">Lihat Katalog</Link></div></div></div></PageContainer></section>;
}

export function TestimonialsSection({content}:{content:Content}) {
 const items=visibleItems(content.items,"TESTIMONIAL");if(!items.length)return null;
 return <section aria-labelledby="testimonials-title" className="public-section bg-[#F6F6F6]"><PageContainer className="grid gap-8 lg:grid-cols-[minmax(15rem,0.32fr)_minmax(0,0.68fr)] lg:gap-12"><ScrollReveal><p className="public-eyebrow">Pengalaman Pelanggan</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" id="testimonials-title">Apa Kata Pelanggan Kami</h2><p className="mt-5 max-w-md leading-7 text-[#606060]">Testimoni pelanggan yang dipublikasikan oleh dealer melalui pengelolaan konten website.</p></ScrollReveal><ScrollReveal className="min-w-0" delay={70}><TestimonialCarousel items={items.map(({id,title,body})=>({id,title,body}))} /></ScrollReveal></PageContainer></section>;
}
