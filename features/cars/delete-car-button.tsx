"use client";

import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { criticalAction } from "@/features/admin/confirmation-policy";
import { Button } from "@/components/ui/button";
import { deleteCarAction } from "@/server/cars/actions";

export function DeleteCarButton({ id, label }: { id: string; label: string }) {
  return (
    <ConfirmationForm action={deleteCarAction} confirmation={() => criticalAction(`Hapus ${label}?`, "Kendaraan dan referensi gambarnya akan dihapus. Tindakan ini tidak dapat dibatalkan.", "Hapus kendaraan", true)}>
      <input name="id" type="hidden" value={id} />
      <Button className="min-h-9 px-3 py-1.5" type="submit" variant="danger">Hapus</Button>
    </ConfirmationForm>
  );
}
