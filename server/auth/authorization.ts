import "server-only";
import { LEGACY_DEALER_SCOPE, type DealerScope } from "@/server/dealer/scope";

export type PlatformAdministrator = {
  readonly role: "platform-admin";
  readonly subjectId: string;
};

export type DealerAdministrator = {
  readonly role: "dealer-admin";
  readonly subjectId: string;
  readonly scope: DealerScope;
};

export type AdministratorIdentity = PlatformAdministrator | DealerAdministrator;

export type AuthorizationRequest = {
  readonly permission: "dealer:operate" | "dealer:standalone-branding:write" | "platform:dealer-branding:write";
  readonly scope: DealerScope;
};

function isId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value === value.trim();
}

function isDealerScope(value: unknown): value is DealerScope {
  if (value === null || typeof value !== "object" || !("kind" in value) || !("dealerId" in value)) return false;
  if (value.kind === LEGACY_DEALER_SCOPE.kind) return value.dealerId === LEGACY_DEALER_SCOPE.dealerId;
  return value.kind === "registered-dealer" && isId(value.dealerId) && value.dealerId !== LEGACY_DEALER_SCOPE.dealerId;
}

// Evaluate verified server identities and trusted resource scopes only.
// This checks permissions, not session authenticity or row ownership.
export function allowsPermission(identity: unknown, request: unknown): boolean {
  if (identity === null || typeof identity !== "object" || !("subjectId" in identity) ||
      !isId(identity.subjectId) || !("role" in identity)) return false;
  if (request === null || typeof request !== "object" || !("scope" in request) ||
      !isDealerScope(request.scope) || !("permission" in request)) return false;

  switch (request.permission) {
    case "platform:dealer-branding:write":
      return identity.role === "platform-admin";
    case "dealer:standalone-branding:write":
      if (request.scope.kind !== LEGACY_DEALER_SCOPE.kind) return false;
      // The legacy operator may manage only its standalone presentation.
      // This does not grant platform branding permissions.
      return identity.role === "dealer-admin" && "scope" in identity && isDealerScope(identity.scope) &&
        identity.scope.kind === LEGACY_DEALER_SCOPE.kind;
    case "dealer:operate":
      return identity.role === "dealer-admin" && "scope" in identity && isDealerScope(identity.scope) &&
        identity.scope.kind === request.scope.kind && identity.scope.dealerId === request.scope.dealerId;
    default:
      return false;
  }
}
