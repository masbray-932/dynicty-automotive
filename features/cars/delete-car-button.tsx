"use client";

import { Button } from "@/components/ui/button";
import { deleteCarAction } from "@/server/cars/actions";

export function DeleteCarButton({ id, label }: { id: string; label: string }) {
  return (
    <form action={deleteCarAction} onSubmit={(event) => { if (!window.confirm(`Hapus ${label}? Gambar terkait juga akan dihapus.`)) event.preventDefault(); }}>
      <input name="id" type="hidden" value={id} />
      <Button className="min-h-9 px-3 py-1.5" type="submit" variant="danger">Hapus</Button>
    </form>
  );
}
