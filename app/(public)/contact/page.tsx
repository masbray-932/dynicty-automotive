import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { DealerContact } from "@/features/content/public-sections";
import { getDealerPresentation } from "@/server/homepage/service";
import { getPublicDealerContent } from "@/server/content/service";
import { publicMetadata } from "@/server/editorial/metadata";
export async function generateMetadata(){await connection();return publicMetadata("Kontak Kami","Informasi kontak, lokasi dan jam operasional showroom.","/contact");}
export default async function Page(){await connection();const [dealer,content]=await Promise.all([getDealerPresentation(),getPublicDealerContent()]);return <><PageContainer className="pt-12"><h1 className="text-4xl font-bold">Kontak Kami</h1></PageContainer><DealerContact dealer={dealer} hours={content.profile?.operatingHoursActive?content.profile.operatingHours:undefined}/></>;}
