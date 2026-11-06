import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { normalizeDealerHostname } from "./hostname";
import { LEGACY_DEALER_SCOPE, type DealerScope } from "./scope";

const bindingSelect = {
  id: true,
  dealerId: true,
  hostname: true,
  verificationState: true,
  routingState: true,
  isCanonical: true,
  bindingVersion: true,
  verifiedAt: true,
  activatedAt: true,
} satisfies Prisma.DealerDomainSelect;

type Binding = Prisma.DealerDomainGetPayload<{ select: typeof bindingSelect }>;

function isRoutable(binding: Binding, dealerId: string): boolean {
  return binding.dealerId === dealerId &&
    binding.verificationState === "VERIFIED" && binding.routingState === "ACTIVE" &&
    binding.verifiedAt != null && binding.activatedAt != null &&
    Number.isSafeInteger(binding.bindingVersion) && binding.bindingVersion >= 1 &&
    normalizeDealerHostname(binding.hostname) === binding.hostname;
}

export type ResolvedDealerDomain = {
  readonly scope: Extract<DealerScope, { kind: "registered-dealer" }>;
  readonly hostname: string;
  readonly canonicalHostname: string;
  readonly bindingId: string;
  readonly bindingVersion: number;
};

// Internal routing lookup only. A hostname is a public selector, not a grant.
// The caller must establish ingress trust before using this for real requests.
export async function resolveDealerDomain(input: unknown): Promise<ResolvedDealerDomain | null> {
  const hostname = normalizeDealerHostname(input);
  if (!hostname) return null;

  // Keep the binding, owner, and canonical relation on the same snapshot.
  // Explicit cardinality checks fail closed if database invariants are missing.
  return db.$transaction(async (tx) => {
    const matches = await tx.dealerDomain.findMany({
      where: { hostname },
      take: 2,
      select: {
        ...bindingSelect,
        dealer: {
          select: {
            id: true,
            lifecycle: true,
            domains: { where: { isCanonical: true }, take: 2, select: bindingSelect },
          },
        },
      },
    });
    if (matches.length !== 1) return null;

    const binding = matches[0];
    const { dealer } = binding;
    if (!dealer || dealer.lifecycle !== "ACTIVE" || dealer.id === LEGACY_DEALER_SCOPE.dealerId ||
        !dealer.id || dealer.id !== dealer.id.trim() ||
        binding.hostname !== hostname || !isRoutable(binding, dealer.id) || dealer.domains.length !== 1) {
      return null;
    }

    const canonical = dealer.domains[0];
    if (!canonical.isCanonical || !isRoutable(canonical, dealer.id)) return null;
    if (binding.isCanonical
      ? canonical.id !== binding.id || canonical.hostname !== hostname
      : canonical.id === binding.id || canonical.hostname === hostname) return null;

    return {
      scope: { kind: "registered-dealer", dealerId: dealer.id },
      hostname,
      canonicalHostname: canonical.hostname,
      bindingId: binding.id,
      bindingVersion: binding.bindingVersion,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}
