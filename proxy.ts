import { type NextRequest, NextResponse } from "next/server";
import { resolveLegacyVehiclePublication } from "@/server/storefront/vehicle-publication-gate";

export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();

  const slug = request.nextUrl.pathname.slice("/cars/".length);
  const publication = await resolveLegacyVehiclePublication(slug);
  if (publication !== "not-found") return NextResponse.next();

  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = "/_not-found";
  notFoundUrl.search = "";
  // Next can reset an internal rewrite's status while streaming an RSC target.
  // Return a plain negative transport response for Flight/HEAD requests. The
  // router can fall back to the normal HTML URL, which renders our branded 404.
  // Do not synthesize or depend on Next's private Flight wire format.
  const response = request.method === "HEAD" || request.headers.get("rsc") === "1"
    ? new NextResponse("", { status: 404 })
    : NextResponse.rewrite(notFoundUrl, { status: 404 });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: "/cars/:slug" };
