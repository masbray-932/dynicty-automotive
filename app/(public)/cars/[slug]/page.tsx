import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Detail Mobil",
    description: `Fondasi detail kendaraan ${slug}.`,
    alternates: { canonical: `/cars/${slug}` },
  };
}

export default async function CarDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <PageContainer className="py-16">
      <Card>
        <p className="text-sm text-red-300">Route foundation</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Detail Mobil</h1>
        <p className="mt-3 text-zinc-400">Slug: {slug}</p>
        <p className="mt-6 text-zinc-400">Detail final dan WhatsApp CTA akan dibuat pada Phase 4.</p>
      </Card>
    </PageContainer>
  );
}
