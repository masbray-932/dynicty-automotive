const SAFE_SEGMENT = /[^a-z0-9._-]+/g;

function safeSegment(value: string) {
  return value.toLowerCase().trim().replace(SAFE_SEGMENT, "-").replace(/\.{2,}/g, "-").replace(/^\.+/, "").replace(/-+/g, "-").slice(0, 100);
}

function safeName(original: string, mime?: string) {
  const name = safeSegment(original) || "image";
  if (!mime) return name;
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime];
  if (!extension) throw new Error("Unsupported image MIME.");
  return `${name.replace(/\.[^.]*$/, "") || "image"}.${extension}`;
}
function assertSuffix(suffix: string) {
  if (!/^[a-zA-Z0-9-]+$/.test(suffix)) throw new Error("Invalid media suffix.");
}

export function createCarImageKey(
  carId: string,
  originalName: string,
  uniqueSuffix = crypto.randomUUID(),
  mime?: string,
) {
  assertSuffix(uniqueSuffix);
  const fileName = safeName(originalName, mime);
  return `cars/${safeSegment(carId)}/${uniqueSuffix}-${fileName}`;
}

export function createDealerLogoKey(originalName: string, uniqueSuffix = crypto.randomUUID(), mime?: string) {
  assertSuffix(uniqueSuffix);
  const fileName = safeName(originalName, mime);
  return `dealer/logo/${uniqueSuffix}-${fileName}`;
}

export function assertSafeStorageKey(key: string) {
  if (!key || key.startsWith("/") || key.includes("..") || key.includes("\\")) {
    throw new Error("Unsafe storage key.");
  }
}

export function createContentMediaKey(namespace: string, mime: string, suffix = crypto.randomUUID()) {
  if (!["showroom", "main_banner", "promo_banner", "leasing_partner"].includes(namespace)) throw new Error("Invalid content namespace.");
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime];
  if (!extension || !/^[a-zA-Z0-9-]+$/.test(suffix)) throw new Error("Invalid media key input.");
  return `dealers/default/content/${namespace}/${suffix}.${extension}`;
}
