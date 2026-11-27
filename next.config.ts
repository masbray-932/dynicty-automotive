import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers";
import { isStagingDeployment } from "./lib/deployment-environment";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Auto Eighteen requires SEO metadata in the server-delivered <head> for
  // every user agent. Async public-layout icons and page metadata otherwise
  // stream after </head> in Next 16. Blocking waits for existing metadata reads
  // (no extra DB queries); the TTFB tradeoff is documented in the hotfix report.
  htmlLimitedBots: /.*/,
  // The detail proxy must distinguish Flight requests before streaming starts.
  // Next otherwise strips RSC headers from the Proxy request.
  skipProxyUrlNormalize: true,
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    const baseline = securityHeaders(process.env.NODE_ENV === "production");
    const stagingHeaders = isStagingDeployment()
      ? [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ]
      : [];
    return [
      { source: "/:path*", headers: [...baseline, ...stagingHeaders] },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
