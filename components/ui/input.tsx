import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-4 text-white placeholder:text-zinc-500 focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-focus/20 ${className}`}
      {...props}
    />
  );
}
