import type { AnchorHTMLAttributes, ReactNode } from "react";
import { WhatsAppIcon } from "./whatsapp-icon";

export const whatsappButtonClass = "inline-flex min-h-[54px] max-w-full min-w-0 items-stretch rounded-[10px] border border-white/10 bg-[linear-gradient(105deg,#20c85a_0%,#0b9f40_55%,#087d32_100%)] text-[16px] font-bold leading-tight text-white no-underline shadow-[0_5px_12px_rgba(5,104,47,0.16),inset_0_1px_0_rgba(255,255,255,0.16)] transition-[filter,box-shadow,transform] duration-200 hover:-translate-y-px hover:brightness-[1.06] hover:shadow-[0_7px_15px_rgba(5,104,47,0.22)] active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-[#163eac] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-[420px]:text-[15px]";

const whatsappVariants = {
  default: whatsappButtonClass,
  header: whatsappButtonClass,
  menu: `${whatsappButtonClass} w-full`,
  floating: "inline-flex min-h-[58px] max-w-[calc(100vw-24px)] items-stretch overflow-hidden rounded-[17px] border border-white/30 bg-[#0B7D36] p-0 text-white no-underline shadow-[0_5px_18px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.1)] transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[0_8px_22px_rgba(0,0,0,0.24)] active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-[#111] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-[600px]:min-h-[52px] max-[600px]:rounded-[15px]",
} as const;

export type WhatsAppLinkVariant = keyof typeof whatsappVariants;

export function WhatsAppButtonContent({ children }: { children: ReactNode }) {
  return <><span aria-hidden="true" className="grid flex-[0_0_54px] place-items-center rounded-l-[9px] border-r border-white/10 bg-white/10 max-[420px]:flex-[0_0_46px]"><WhatsAppIcon /></span><span className="flex min-w-0 flex-1 items-center justify-center whitespace-normal break-words px-5 py-3 text-center max-[420px]:px-3">{children}</span></>;
}

export function WhatsAppLink({ children, className = "", variant = "default", ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; variant?: WhatsAppLinkVariant }) {
  return <a {...props} className={`${whatsappVariants[variant]} ${className}`} rel="noopener noreferrer" target="_blank">{variant === "floating" ? <><span className="flex min-w-0 items-center justify-center bg-[#075E2C] px-4 text-center text-sm font-extrabold leading-tight max-[600px]:px-3 max-[600px]:text-xs">{children}</span><span aria-hidden="true" className="grid w-[58px] shrink-0 place-items-center bg-[linear-gradient(145deg,#20C85A_0%,#0E9B43_100%)] max-[600px]:w-[52px]"><WhatsAppIcon className="h-[32px] w-[32px] max-[600px]:h-[29px] max-[600px]:w-[29px]" filled /></span></> : <WhatsAppButtonContent>{children}</WhatsAppButtonContent>}</a>;
}
