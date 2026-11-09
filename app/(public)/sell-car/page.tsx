import { connection } from "next/server";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { getDealerPresentation } from "@/server/homepage/service";
import { publicMetadata } from "@/server/editorial/metadata";
import { SellCarInquiry } from "@/features/sell-car/inquiry-form";
export async function generateMetadata(){await connection();return publicMetadata("Jual Mobil","Siapkan informasi kendaraan untuk menanyakan prosedur jual mobil kepada showroom.","/sell-car");}
export default async function Page(){await connection();const dealer=await getDealerPresentation();return <PageContainer className="max-w-4xl py-12"><h1 className="text-4xl font-bold">Jual Mobil</h1><p className="mt-5 leading-8 text-zinc-300">Sampaikan informasi awal kendaraan melalui WhatsApp. Showroom akan menjelaskan prosedur yang tersedia; inquiry tidak menjamin penilaian harga atau pembelian kendaraan.</p><SellCarInquiry number={dealer.whatsappNumber}/><Link href="/contact" className="mt-6 inline-block min-h-11 py-2 text-red-300 focus-visible:outline-2 focus-visible:outline-brand-focus">Kontak Kami</Link></PageContainer>;}
