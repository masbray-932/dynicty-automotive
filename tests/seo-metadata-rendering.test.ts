import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { inspectMetadataHtml } from "../scripts/verify-seo-metadata-head.mjs";

describe("server-delivered metadata head contract", () => {
  it.each(["Mozilla/5.0 Chrome/131", "Googlebot/2.1", "Twitterbot/1.0", "facebookexternalhit/1.1", "UnknownBrowser/1.0", ""])("uses supported blocking metadata for %s", agent => {
    expect(nextConfig.htmlLimitedBots?.test(agent)).toBe(true);
  });
  it("distinguishes streamed body metadata from genuinely absent metadata", () => {
    const result=inspectMetadataHtml('<html><head></head><body><title>Dealer</title><meta name="description" content="Original description"></body></html>');
    expect(result.titles).toEqual(["Dealer"]);expect(result.descriptions).toEqual(["Original description"]);
    expect(result.headTitles).toEqual([]);expect(result.headDescriptions).toEqual([]);
    expect(inspectMetadataHtml('<html><head></head><body></body></html>').titles).toEqual([]);
  });
  it("counts actual head tags once and ignores serialized Flight/script lookalikes", () => {
    const result=inspectMetadataHtml('<html><head><title>Auto &amp; Dealer</title><meta name="description" content="Cash, Credit &amp; Trade In"><link rel="canonical" href="https://example.test/"><link rel="icon" href="/configured.webp"><meta property="og:title" content="Auto &amp; Dealer"><meta name="twitter:title" content="Auto &amp; Dealer"><meta name="robots" content="index, follow"></head><body><script>const sample="<title>Not a metadata tag</title>";</script></body></html>');
    expect(result.titles).toEqual(["Auto & Dealer"]);expect(result.headTitles).toEqual(result.titles);expect(result.headDescriptions).toEqual(["Cash, Credit & Trade In"]);
    expect(result.canonical).toEqual(["https://example.test/"]);expect(result.icons).toEqual(["/configured.webp"]);expect(result.openGraph["og:title"]).toBe("Auto & Dealer");expect(result.twitter["twitter:title"]).toBe("Auto & Dealer");expect(result.robots).toBe("index, follow");
  });
  it("detects duplicates instead of concealing inheritance regressions", () => {
    const result=inspectMetadataHtml('<head><title>First</title><meta name="description" content="First"></head><body><title>Second</title><meta name="description" content="Second"></body>');
    expect(result.titles).toHaveLength(2);expect(result.descriptions).toHaveLength(2);
  });
});
