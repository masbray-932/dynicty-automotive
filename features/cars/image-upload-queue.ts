export type UploadQueueStatus = "pending" | "uploading" | "success" | "error";
export type UploadQueueItem<T = File> = {
  id: string;
  file: T;
  status: UploadQueueStatus;
  message: string;
  serverImageId?: string;
};

export function uploadFileFingerprint(file: Pick<File, "name" | "size" | "type" | "lastModified">) {
  return `${file.name}\u0000${file.size}\u0000${file.type}\u0000${file.lastModified}`;
}

export function reorderUploadQueue<T extends UploadQueueItem>(items: T[], id: string, direction: "up" | "down") {
  const index = items.findIndex(item => item.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function pendingUploadIds(items: UploadQueueItem[]) {
  return items.filter(item => item.status === "pending" || item.status === "error").map(item => item.id);
}

export function successfulUploadIds(items: UploadQueueItem[]) {
  return items.flatMap(item => item.status === "success" && item.serverImageId ? [item.serverImageId] : []);
}

export function hasUnsavedUploads(items: UploadQueueItem[]) {
  return items.some(item => item.status === "pending" || item.status === "uploading" || item.status === "error");
}

type UploadResult = {
  message: string;
  errors?: Record<string, string[]>;
  image?: { id: string };
};

export async function uploadQueueItems<T extends UploadQueueItem>(options: {
  items: T[];
  ids: string[];
  upload: (file: T["file"]) => Promise<UploadResult>;
  onChange?: (items: T[]) => void;
  onProgress?: (done: number, total: number) => void;
}) {
  let working = options.items;
  let done = 0;
  for (const id of options.ids) {
    const item = working.find(entry => entry.id === id);
    if (!item || item.status === "success") continue;
    working = working.map(entry => entry.id === id ? { ...entry, status: "uploading", message: "Mengunggah…" } : entry);
    options.onChange?.(working);
    try {
      const result = await options.upload(item.file);
      working = working.map(entry => entry.id === id ? result.image
        ? { ...entry, status: "success", message: result.message, serverImageId: result.image.id }
        : { ...entry, status: "error", message: result.errors?.image?.[0] ?? result.message }
        : entry);
    } catch {
      working = working.map(entry => entry.id === id
        ? { ...entry, status: "error", message: "Upload terhenti karena gangguan tak terduga. Coba lagi." }
        : entry);
    }
    done += 1;
    options.onChange?.(working);
    options.onProgress?.(done, options.ids.length);
  }
  return working;
}

export async function arrangeSuccessfulQueue(options: {
  items: UploadQueueItem[];
  primaryQueueId: string | null;
  arrange: (imageIds: string[], primaryImageId?: string) => Promise<{ status?: "success" | "error" | "warning"; message: string }>;
}) {
  const imageIds = successfulUploadIds(options.items);
  if (!imageIds.length) return { ok: true, message: "" };
  const primaryImageId = options.items.find(item => item.id === options.primaryQueueId)?.serverImageId;
  try {
    const result = await options.arrange(imageIds, primaryImageId);
    return result.status === "success"
      ? { ok: true, message: result.message }
      : { ok: false, message: result.message || "Foto tersimpan, tetapi urutan belum dapat diterapkan." };
  } catch {
    return { ok: false, message: "Foto sudah tersimpan, tetapi urutan gagal diterapkan karena gangguan tak terduga." };
  }
}
