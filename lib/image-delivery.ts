/** Persistent uploads are served directly by the media host, outside Next's optimizer. */
export function shouldBypassImageOptimization(url: string) {
  return url.startsWith("/uploads/") || /^https?:\/\//.test(url) || url.startsWith("blob:");
}
