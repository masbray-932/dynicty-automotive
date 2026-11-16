import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";
import { WhatsAppLink } from "./whatsapp-link";

export function FloatingWhatsapp({ dealer }: { dealer: DealerPresentation }) {
  if (!dealer.whatsappWidgetEnabled) return null;
  const href = createWhatsappUrl(dealer.whatsappNumber, dealer.whatsappWidgetMessage);
  if (!href) return null;
  return <WhatsAppLink aria-label={`Hubungi sales ${dealer.dealerName} melalui WhatsApp`} className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] right-[max(18px,env(safe-area-inset-right))] z-50 max-[600px]:bottom-[calc(14px+env(safe-area-inset-bottom))] max-[600px]:right-[max(12px,env(safe-area-inset-right))]" href={href} title="Hubungi Sales Kami" variant="floating">Hubungi Sales Kami</WhatsAppLink>;
}
