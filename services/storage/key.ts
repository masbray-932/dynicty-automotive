const SAFE_SEGMENT = /[^a-z0-9._-]+/g;

function safeSegment(value: string) {
  return value.toLowerCase().trim().replace(SAFE_SEGMENT, "-").replace(/-+/g, "-");
}

export function createCarImageKey(
  carId: string,
  originalName: string,
  uniqueSuffix = crypto.randomUUID(),
) {
  const fileName = safeSegment(originalName) || "image";
  return `cars/${safeSegment(carId)}/${uniqueSuffix}-${fileName}`;
}

export function assertSafeStorageKey(key: string) {
  if (!key || key.startsWith("/") || key.includes("..") || key.includes("\\")) {
    throw new Error("Unsafe storage key.");
  }
}
