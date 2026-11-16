import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">{eyebrow}</p> : null}
      <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
  </header>;
}
export function AdminActionLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus ${secondary ? "border border-white/15 bg-white/5 text-white hover:bg-white/10" : "bg-brand-primary text-brand-on-primary hover:brightness-110"}`} href={href}>{children}</Link>;
}

export function AdminSection({ title, description, actions, children, className = "" }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/10 bg-zinc-900/70 ${className}`}>
    {title || description || actions ? <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>{title ? <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2> : null}{description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}</div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div> : null}
    <div className="p-4 sm:p-5">{children}</div>
  </section>;
}

const statusStyles = {
  success: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-200",
  neutral: "bg-white/10 text-zinc-300",
  danger: "bg-red-500/15 text-red-300",
} as const;
export function AdminStatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof statusStyles }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[tone]}`}>{children}</span>;
}

export function AdminEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center"><h3 className="font-bold text-white">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">{description}</p>{action ? <div className="mt-5 flex justify-center">{action}</div> : null}</div>;
}
