export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlug(value: string, exists: (candidate: string) => Promise<boolean>) {
  const base = slugify(value) || "mobil";
  let candidate = base;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function reorderImageIds(ids: string[], targetId: string, direction: "up" | "down") {
  const next = [...ids];
  const currentIndex = next.indexOf(targetId);
  if (currentIndex < 0) throw new Error("Image not found in ordered set.");

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= next.length) return next;
  [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
  return next;
}

export function fallbackPrimaryImageId(orderedIds: string[], deletedWasPrimary: boolean) {
  return deletedWasPrimary ? orderedIds[0] ?? null : null;
}

export function modelBelongsToBrand(model: { brandId: string } | null, brandId: string) {
  return model?.brandId === brandId;
}
