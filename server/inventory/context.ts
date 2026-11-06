import "server-only";
import { resolveDealerDomain } from "@/server/dealer/registry";
import { LEGACY_DEALER_SCOPE, type DealerScope } from "@/server/dealer/scope";

type RegisteredScope = Extract<DealerScope, { kind: "registered-dealer" }>;
type InventoryScope =
  | typeof LEGACY_DEALER_SCOPE
  | { kind: RegisteredScope["kind"]; dealerId: string; bindingId: string; bindingVersion: number };

declare const inventoryContext: unique symbol;
export type InventoryContext = { readonly [inventoryContext]: true };
const contexts = new WeakMap<object, InventoryScope>();

function issue(scope: InventoryScope): InventoryContext {
  const context = Object.freeze({}) as InventoryContext;
  contexts.set(context, Object.freeze(scope));
  return context;
}

const legacyContext = issue(LEGACY_DEALER_SCOPE);

// Explicit compatibility entry point, never a fallback from domain resolution.
export function legacyInventoryContext(): InventoryContext {
  return legacyContext;
}

// Internal public-read selection only. The caller must verify ingress before
// wiring this to requests; this can never authorize an administrative write.
export async function resolveInventoryReadContext(hostname: unknown): Promise<InventoryContext | null> {
  const resolved = await resolveDealerDomain(hostname);
  if (!resolved) return null;
  const { scope, bindingId, bindingVersion } = resolved;
  if (scope.kind !== "registered-dealer" || !scope.dealerId ||
      scope.dealerId === LEGACY_DEALER_SCOPE.dealerId || scope.dealerId !== scope.dealerId.trim() ||
      !bindingId || !Number.isSafeInteger(bindingVersion) || bindingVersion < 1) return null;
  return issue({ ...scope, bindingId, bindingVersion });
}

export function requireInventoryScope(context: InventoryContext): InventoryScope {
  const scope = contexts.get(context);
  if (!scope) throw new Error("Trusted inventory context required.");
  return scope;
}
