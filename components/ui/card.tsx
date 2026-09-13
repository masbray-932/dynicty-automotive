import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-zinc-900/75 p-6 shadow-2xl shadow-black/20 ${className}`}
      {...props}
    />
  );
}
