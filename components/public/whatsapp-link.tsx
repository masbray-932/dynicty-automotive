import type { AnchorHTMLAttributes, ReactNode } from "react";
import { WhatsAppIcon } from "./whatsapp-icon";

const sharedClass = "inline-flex items-center justify-center gap-2 font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]";
export const whatsappButtonClass = `${sharedClass} min-h-11 rounded-md border border-[#1EBE5A] bg-[#25D366] px-4 text-sm text-[#063D20] shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)] hover:border-[#19A94E] hover:bg-[#20C760]`;

const whatsappVariants = {
  default: whatsappButtonClass,
  header: `${sharedClass} min-h-10 rounded-md border border-[#41DF7C] bg-[#25D366] px-4 text-xs uppercase tracking-[0.08em] text-[#063D20] shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-[#39DA73]`,
  menu: `${sharedClass} min-h-11 w-full justify-start rounded-md border border-[#25D366]/35 bg-[#25D366]/10 px-3 text-sm text-[#DDFBE8] hover:border-[#25D366]/55 hover:bg-[#25D366]/15`,
  floating: `${sharedClass} h-12 min-h-12 w-12 rounded-full border border-[#1EBE5A] bg-[#25D366] p-0 text-[#063D20] shadow-[0_6px_18px_rgba(6,61,32,0.22)] hover:bg-[#20C760] hover:shadow-[0_8px_22px_rgba(6,61,32,0.28)]`,
} as const;

export type WhatsAppLinkVariant = keyof typeof whatsappVariants;

export function WhatsAppLink({ children, className = "", variant = "default", ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; variant?: WhatsAppLinkVariant }) {
  return <a {...props} className={`${whatsappVariants[variant]} ${className}`} rel="noopener noreferrer" target="_blank"><WhatsAppIcon className={variant === "floating" ? "h-6 w-6" : "h-5 w-5"} />{children}</a>;
}
