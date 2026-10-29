import "server-only";

import { logger } from "@/server/log";

export function reportUploadFailure(event: string, error: unknown, context: { carId?: string } = {}) {
  const candidate = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const code = ["EACCES", "EPERM", "ENOSPC", "ENOENT", "EROFS"].includes(candidate) ? candidate : /^P\d{4}$/.test(candidate) ? candidate : "UNKNOWN";
  logger.error(event, { ...context, code });
  if (["EACCES", "EPERM", "EROFS"].includes(code)) return "Penyimpanan gambar belum dapat ditulis. Hubungi pengelola website.";
  if (code === "ENOSPC") return "Penyimpanan gambar penuh. Hubungi pengelola website.";
  return "Gambar tidak dapat disimpan. Silakan coba kembali atau hubungi pengelola website.";
}
