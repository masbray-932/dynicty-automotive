import { PageContainer } from "@/components/ui/page-container";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-black py-10">
      <PageContainer className="flex flex-col justify-between gap-3 text-sm text-zinc-400 sm:flex-row">
        <p>© {new Date().getFullYear()} Dynicty Automotive.</p>
        <p>Informasi dealer dapat dikelola melalui Dealer Settings.</p>
      </PageContainer>
    </footer>
  );
}
