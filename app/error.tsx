"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <h2 className="text-2xl font-bold text-white">Terjadi kendala</h2>
        <p className="mt-3 text-zinc-400">Permintaan tidak dapat diselesaikan. Silakan coba kembali.</p>
        <Button className="mt-6" onClick={reset} type="button">Coba lagi</Button>
      </div>
    </main>
  );
}
