import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers";
import { isStagingDeployment } from "./lib/deployment-environment";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
