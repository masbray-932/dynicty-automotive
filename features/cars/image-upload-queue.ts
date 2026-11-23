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
