import Image from "next/image";
import { PageContainer } from "@/components/ui/page-container";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { WhatsAppIcon } from "@/components/public/whatsapp-icon";

export type PublicSalesMember = { id: string; fullName: string; title: string; biography: string; imageUrl: string | null; whatsappUrl: string | null };

export function PublicSalesTeam({ members }: { members: PublicSalesMember[] }) {
  if (!members.length) return null;
  return <section className="public-section bg-[#F6F6F6]" aria-labelledby="sales-team-title"><PageContainer><ScrollReveal><p className="public-eyebrow">Siap Membantu</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" id="sales-team-title">Tim Sales Kami</h2></ScrollReveal><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{members.map((member,index) => <ScrollReveal className="h-full" delay={index*55} key={member.id}><article className="h-full overflow-hidden rounded-lg border border-[#E5E5E5] bg-white"><div className="relative h-52 bg-[#EFEFEF] sm:h-56">{member.imageUrl ? <Image alt={`Foto ${member.fullName}, ${member.title}`} className="object-contain p-3" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={member.imageUrl} unoptimized /> : <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[#606060]">Foto belum tersedia</div>}</div><div className="p-6"><h3 className="text-xl font-bold text-[#171717]">{member.fullName}</h3><p className="mt-1 text-sm font-semibold text-[#C8102E]">{member.title}</p>{member.biography ? <p className="mt-4 whitespace-pre-line leading-7 text-[#606060]">{member.biography}</p> : null}{member.whatsappUrl ? <a className="mt-5 inline-flex min-h-11 items-center gap-2 rounded bg-brand-primary px-5 font-bold text-brand-on-primary focus-visible:outline-2 focus-visible:outline-brand-focus" href={member.whatsappUrl} rel="noopener noreferrer" target="_blank" aria-label={`Hubungi ${member.fullName} melalui WhatsApp`}><WhatsAppIcon />Hubungi via WhatsApp</a> : null}</div></article></ScrollReveal>)}</div></PageContainer></section>;
}
