export function confirmBrandRename(original: string | undefined, proposed: string, confirm: (message: string) => boolean) {
  if (original === undefined || original.trim() === proposed.trim()) return true;
  return confirm(`Ubah nama merek "${original}" menjadi "${proposed.trim()}"?`);
}
