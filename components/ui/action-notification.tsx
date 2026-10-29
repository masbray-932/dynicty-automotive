"use client";

import { useState } from "react";
import type { ActionState } from "@/types/action-state";

/** One instance per form group; key by resultId to announce repeated outcomes once. */
export function ActionNotification({ state }: { state: ActionState | null }) {
  const [dismissed, setDismissed] = useState(false);
  if (!state?.message || dismissed) return null;
  const status = state.status ?? "error";
  const label = status === "success" ? "Berhasil" : status === "warning" ? "Perhatian" : "Tidak berhasil";
  return <div className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-white/20 bg-zinc-950 p-4 text-white shadow-xl sm:left-auto sm:right-6 sm:mx-0" role={status === "error" ? "alert" : "status"} aria-atomic="true">
    <div className="min-w-0 flex-1"><p className={status === "success" ? "font-bold text-emerald-300" : status === "warning" ? "font-bold text-amber-300" : "font-bold text-red-300"}>{label}</p><p className="mt-1 break-words text-sm">{state.message}</p></div>
    <button aria-label="Tutup notifikasi" className="min-h-11 min-w-11 rounded-lg border border-white/20 focus-visible:outline-2 focus-visible:outline-brand-focus" onClick={() => setDismissed(true)} type="button">×</button>
  </div>;
}
