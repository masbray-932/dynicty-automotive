import { Card } from "@/components/ui/card";

export default async function EditCarFoundationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Card><h1 className="text-2xl font-bold">Edit Mobil</h1><p className="mt-3 text-zinc-400">Route untuk kendaraan {id} siap. Form dibuat pada Phase 1.</p></Card>;
}
