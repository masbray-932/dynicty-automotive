"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function AdminEditorPanel({ label, title, description, children, defaultOpen = false }: { label: string; title: string; description?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [dirty, setDirty] = useState(false);
  const titleId = useId();
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => { if (open) cancelButton.current?.focus(); }, [open]);
  const close = () => {
    if (dirty && !window.confirm("Perubahan belum disimpan. Tutup editor dan abaikan perubahan?")) return;
    setDirty(false); setOpen(false);
  };
  if (!open) return <Button type="button" variant="secondary" onClick={() => setOpen(true)} aria-expanded="false">{label}</Button>;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section aria-labelledby={titleId} aria-modal="true" className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-brand-primary/40 bg-zinc-950 p-4 shadow-2xl sm:p-6" onChangeCapture={() => setDirty(true)} onSubmitCapture={() => setDirty(false)} onKeyDown={event => { if (event.key === "Escape") close(); }} role="dialog">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-white" id={titleId}>{title}</h3>{description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}</div><button ref={cancelButton} type="button" className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand-focus" onClick={close}>Batal</button></div>
      {children}
    </section>
  </div>;
}
