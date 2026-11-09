import { type NextRequest, NextResponse } from "next/server";
import { resolveLegacyVehiclePublication } from "@/server/storefront/vehicle-publication-gate";

import { publicNotFoundResponse } from "@/server/storefront/not-found-response";
import { resolveEditorialPublication } from "@/server/editorial/publication";

export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();

  const [, namespace, slug] = request.nextUrl.pathname.split("/");
  const publication = namespace === "cars" ? await resolveLegacyVehiclePublication(slug) : await resolveEditorialPublication(namespace === "services" ? "service" : "article", slug);
  if (publication !== "not-found") return NextResponse.next();

  // A direct, fixed response preserves transport status behind TLS termination.
  // Flight clients receive no synthetic private wire payload; navigation can
  // fall back to the normal HTML URL. HEAD is bodyless as required.
  return publicNotFoundResponse(request.method === "HEAD" || request.headers.get("rsc") === "1");
}

export const config = { matcher: ["/cars/:slug", "/services/:slug", "/articles/:slug"] };
