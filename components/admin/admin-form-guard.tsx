"use client";

import { useEffect, useState, type ReactNode } from "react";

export function AdminFormGuard({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return <div onChangeCapture={() => setDirty(true)} onSubmitCapture={() => setDirty(false)}>{children}</div>;
}
