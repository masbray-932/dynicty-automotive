import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center py-16">
      <PageContainer className="text-center">
        <p className="text-sm font-bold text-red-400">404</p>
        <h1 className="mt-3 text-4xl font-black text-white">Halaman tidak ditemukan</h1>
        <p className="mt-4 text-zinc-400">Alamat yang kamu buka tidak tersedia.</p>
        <Link className="mt-8 inline-block rounded-xl bg-red-600 px-5 py-3 font-semibold text-white" href="/">Kembali ke beranda</Link>
      </PageContainer>
    </main>
  );
}
