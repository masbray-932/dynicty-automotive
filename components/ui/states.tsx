import { Card } from "./card";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="text-center">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-zinc-400">{description}</p>
    </Card>
  );
}

export function LoadingState({ label = "Memuat…" }: { label?: string }) {
  return <p className="animate-pulse text-sm text-zinc-400" role="status">{label}</p>;
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-red-500/30">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-zinc-400">{description}</p>
    </Card>
  );
}
