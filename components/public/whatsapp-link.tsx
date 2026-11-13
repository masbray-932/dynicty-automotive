import type { AnchorHTMLAttributes, ReactNode } from "react";
import { WhatsAppIcon } from "./whatsapp-icon";

export const whatsappButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#25D366] px-5 font-bold text-[#082D1B] transition hover:bg-[#1EBE5A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B6B37]";

export function WhatsAppLink({ children, className = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return <a {...props} className={`${whatsappButtonClass} ${className}`} rel="noopener noreferrer" target="_blank"><WhatsAppIcon />{children}</a>;
}
