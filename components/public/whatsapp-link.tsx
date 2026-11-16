import type { AnchorHTMLAttributes, ReactNode } from "react";
import { WhatsAppIcon } from "./whatsapp-icon";

export const whatsappButtonClass = "inline-flex min-h-[54px] max-w-full min-w-0 items-stretch rounded-[10px] border border-white/10 bg-[linear-gradient(105deg,#20c85a_0%,#0b9f40_55%,#087d32_100%)] text-[16px] font-bold leading-tight text-white no-underline shadow-[0_5px_12px_rgba(5,104,47,0.16),inset_0_1px_0_rgba(255,255,255,0.16)] transition-[filter,box-shadow,transform] duration-200 hover:-translate-y-px hover:brightness-[1.06] hover:shadow-[0_7px_15px_rgba(5,104,47,0.22)] active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-[#163eac] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-[420px]:text-[15px]";

const whatsappVariants = {
  default: whatsappButtonClass,
  header: whatsappButtonClass,
  menu: `${whatsappButtonClass} w-full`,
  floating: "inline-flex h-12 w-12 items-center justify-center rounded-[15px] border border-white/30 bg-[linear-gradient(145deg,#1BAA55_0%,#108A45_100%)] p-0 text-white shadow-[0_3px_12px_rgba(0,0,0,0.13),0_1px_2px_rgba(0,0,0,0.07)] transition-[background,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-[linear-gradient(145deg,#169C4D_0%,#087A3A_100%)] hover:shadow-[0_5px_15px_rgba(0,0,0,0.16)] active:translate-y-0 active:shadow-[0_2px_7px_rgba(0,0,0,0.12)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-[#111] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-[600px]:h-[46px] max-[600px]:w-[46px] max-[600px]:rounded-[14px]",
} as const;

export type WhatsAppLinkVariant = keyof typeof whatsappVariants;

export function WhatsAppButtonContent({ children }: { children: ReactNode }) {
  return <><span aria-hidden="true" className="grid flex-[0_0_54px] place-items-center rounded-l-[9px] border-r border-white/10 bg-white/10 max-[420px]:flex-[0_0_46px]"><WhatsAppIcon /></span><span className="flex min-w-0 flex-1 items-center justify-center whitespace-normal break-words px-5 py-3 text-center max-[420px]:px-3">{children}</span></>;
}

export function WhatsAppLink({ children, className = "", variant = "default", ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; variant?: WhatsAppLinkVariant }) {
  return <a {...props} className={`${whatsappVariants[variant]} ${className}`} rel="noopener noreferrer" target="_blank">{variant === "floating" ? <><WhatsAppIcon className="h-[26px] w-[26px] max-[600px]:h-[25px] max-[600px]:w-[25px]" filled />{children}</> : <WhatsAppButtonContent>{children}</WhatsAppButtonContent>}</a>;
}
