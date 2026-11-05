import "server-only";

// This row key is only for the existing single-dealer installation.
export const LEGACY_DEALER_SCOPE = Object.freeze({ kind: "legacy-single-dealer", dealerId: "default" } as const);

export type DealerScope = typeof LEGACY_DEALER_SCOPE | {
  readonly kind: "registered-dealer";
  readonly dealerId: string;
};

// Public reads are intentionally single-dealer today. A future resolver must
// look up a verified binding and reject unknown hosts instead of calling this.
export function getLegacyPublicDealerScope() {
  return LEGACY_DEALER_SCOPE;
}
