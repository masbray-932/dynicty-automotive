"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { Confirmation } from "@/features/admin/confirmation-policy";

const subscribe = () => () => {};
function PendingObserver({ changed }: { changed: (pending: boolean) => void }) {
  const { pending } = useFormStatus();
  useEffect(() => changed(pending), [pending, changed]);
  return null;
}

type Props = Omit<ComponentProps<"form">, "onSubmit"> & {
  confirmation: (data: FormData) => Confirmation | null;
  onSubmit?: ComponentProps<"form">["onSubmit"];
};

/** UI accident prevention only. All existing server authorization remains authoritative. */
export function ConfirmationForm({ confirmation, children, onSubmit, ...props }: Props) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const submitter = useRef<HTMLButtonElement | HTMLInputElement | null>(null);
  const approved = useRef<string | null>(null);
  const locked = useRef(false);
  const wasPending = useRef(false);
  const [prompt, setPrompt] = useState<Confirmation | null>(null);
  const [pending, setPending] = useState(false);
  const titleId = useId(); const descriptionId = useId();
  const restoreFocus = () => { if (submitter.current?.isConnected) submitter.current.focus(); };
  const close = () => { dialog.current?.close(); setPrompt(null); approved.current = null; restoreFocus(); };
  const changed = useCallback((value: boolean) => {
    setPending(value);
    if (value) wasPending.current = true;
    else if (wasPending.current) {
      wasPending.current = false; locked.current = false;
      dialog.current?.close(); setPrompt(null); approved.current = null;
      if (submitter.current?.isConnected) submitter.current.focus();
    }
  }, []);
  useEffect(() => {
    if (prompt) {
      if (!dialog.current?.open) dialog.current?.showModal();
      cancelButton.current?.focus();
    }
  }, [prompt]);

  return <form {...props} ref={form} onSubmit={event => {
    if (!ready || locked.current) { event.preventDefault(); return; }
    onSubmit?.(event);
    if (event.defaultPrevented) return;
    const request = confirmation(new FormData(event.currentTarget));
    const fingerprint = JSON.stringify(request);
    if (request && approved.current !== fingerprint) {
      event.preventDefault();
      submitter.current = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null;
      if (!submitter.current) submitter.current = event.currentTarget.querySelector('button[type="submit"], input[type="submit"]');
      setPrompt(request); return;
    }
    approved.current = null;
    locked.current = true;
  }}>
    <fieldset className="contents" disabled={!ready || pending}>{children}</fieldset>
    <PendingObserver changed={changed} />
    <dialog ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-white/20 bg-zinc-950 p-6 text-zinc-100 shadow-2xl backdrop:bg-black/70" onCancel={event => { event.preventDefault(); if (!locked.current) close(); }} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
      if (!buttons.length) { event.preventDefault(); return; }
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      <h2 id={titleId} className="text-xl font-bold">{prompt?.title}</h2>
      <p id={descriptionId} className="mt-3 text-sm leading-6 text-zinc-300">{prompt?.explanation}</p>
      {prompt?.changes?.length ? <dl className="mt-4 grid gap-3 text-sm">{prompt.changes.map((change, index) => <div key={index} className="rounded-lg border border-white/10 p-3"><dt className="font-semibold">{change.label}</dt><dd className="mt-1 break-words whitespace-pre-wrap text-zinc-400">Sebelum: {change.before}</dd><dd className="mt-1 break-words whitespace-pre-wrap">Sesudah: {change.after}</dd></div>)}</dl> : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3" aria-busy={pending}>
        <button ref={cancelButton} type="button" disabled={pending} onClick={() => { if (!locked.current) close(); }} className="min-h-11 rounded-xl border border-white/20 px-5 focus-visible:outline-2 focus-visible:outline-brand-focus disabled:opacity-50">Batal</button>
        <Button type="button" variant={prompt?.destructive ? "danger" : "primary"} disabled={pending} onClick={() => {
          if (locked.current || !form.current || !prompt) return;
          approved.current = JSON.stringify(prompt);
          form.current.requestSubmit(submitter.current ?? undefined);
          approved.current = null;
        }}>{pending ? "Memproses…" : prompt?.actionLabel ?? "Konfirmasi"}</Button>
      </div>
    </dialog>
  </form>;
}
