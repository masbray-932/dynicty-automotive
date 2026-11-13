import { connection } from "next/server";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { getDealerPresentation } from "@/server/homepage/service";
import { publicMetadata } from "@/server/editorial/metadata";
import { SellCarInquiry } from "@/features/sell-car/inquiry-form";
export async function generateMetadata(){await connection();return publicMetadata("Jual Mobil","Siapkan informasi kendaraan untuk menanyakan prosedur jual mobil kepada showroom.","/sell-car");}
export default async function Page(){await connection();const dealer=await getDealerPresentation();return <PageContainer className="max-w-4xl py-12 sm:py-16"><p className="public-eyebrow">Konsinyasi &amp; Penawaran</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Jual Mobil</h1><p className="mt-5 max-w-2xl leading-8 text-[#606060]">Sampaikan informasi awal kendaraan melalui WhatsApp. Showroom akan menjelaskan prosedur yang tersedia; inquiry tidak menjamin penilaian harga atau pembelian kendaraan.</p><div className="mt-8 rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] p-5 sm:p-8"><SellCarInquiry number={dealer.whatsappNumber}/></div><Link href="/contact" className="mt-6 inline-block min-h-11 py-2 font-semibold text-[#C8102E] focus-visible:outline-2 focus-visible:outline-brand-focus">Kontak Kami</Link></PageContainer>;}
