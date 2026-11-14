import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";
import { WhatsAppLink } from "./whatsapp-link";

export function FloatingWhatsapp({ dealer }: { dealer: DealerPresentation }) {
  if (!dealer.whatsappWidgetEnabled) return null;
  const href = createWhatsappUrl(dealer.whatsappNumber, dealer.whatsappWidgetMessage);
  if (!href) return null;
  return <WhatsAppLink aria-label={`Chat dengan ${dealer.dealerName} melalui WhatsApp`} className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] right-[max(18px,env(safe-area-inset-right))] z-50 max-[600px]:bottom-[calc(18px+env(safe-area-inset-bottom))] max-[600px]:right-[max(16px,env(safe-area-inset-right))]" href={href} title="Chat via WhatsApp" variant="floating"><span className="sr-only">Chat WhatsApp</span></WhatsAppLink>;
}
