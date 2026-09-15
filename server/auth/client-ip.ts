type HeaderReader = { get(name: string): string | null };

export function resolveClientIdentifier(headers: HeaderReader, trustProxy: boolean) {
  if (!trustProxy) return "direct-client";
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-proxy-client";
}
