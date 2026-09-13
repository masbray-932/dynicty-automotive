import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/states";
import { PageContainer } from "@/components/ui/page-container";

export const metadata: Metadata = {
  title: "Katalog Mobil",
  description: "Katalog mobil dealer.",
  alternates: { canonical: "/cars" },
};

export default function CarsPage() {
  return (
    <PageContainer className="py-16">
      <h1 className="mb-8 text-3xl font-bold text-white">Katalog Mobil</h1>
      <EmptyState title="Katalog disiapkan" description="Daftar dan filter mobil akan diimplementasikan pada Phase 3." />
    </PageContainer>
  );
}
