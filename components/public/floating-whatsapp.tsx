import { createWhatsappUrl, type DealerPresentation } from "@/features/homepage/domain";
import { WhatsAppLink } from "./whatsapp-link";

export function FloatingWhatsapp({ dealer }: { dealer: DealerPresentation }) {
  if (!dealer.whatsappWidgetEnabled) return null;
  const href = createWhatsappUrl(dealer.whatsappNumber, dealer.whatsappWidgetMessage);
  if (!href) return null;
  return <WhatsAppLink aria-label={`Chat dengan ${dealer.dealerName} melalui WhatsApp`} className="fixed bottom-[max(5rem,calc(env(safe-area-inset-bottom)+1rem))] right-4 z-40 h-14 min-h-14 w-14 rounded-full px-0 shadow-xl sm:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] sm:right-6" href={href}><span className="sr-only">Chat WhatsApp</span></WhatsAppLink>;
}
