import Link from "next/link";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";

export default async function NotFound() {
  // Page-level fallback stays request-time. Detail publication gates return
  // data-free 404 responses directly before streaming, including behind TLS.
  await connection();
  return (
    <main className="grid min-h-screen place-items-center py-16">
      <PageContainer className="text-center">
        <p className="public-eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-bold text-[#171717]">Halaman tidak ditemukan</h1>
        <p className="mt-4 text-[#606060]">Alamat yang kamu buka tidak tersedia.</p>
        <Link className="mt-8 inline-block rounded bg-brand-primary px-5 py-3 font-semibold text-brand-on-primary" href="/">Kembali ke beranda</Link>
      </PageContainer>
    </main>
  );
}
