import "server-only";
import { domainToASCII } from "node:url";

const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// Accept a bare DNS hostname, not a URL, HTTP authority or forwarded header.
export function normalizeDealerHostname(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) return null;
  if (/[\s\p{Cc}]/u.test(value) || Array.from("@:/\\?#%[],*").some((char) => value.includes(char))) {
    return null;
  }

  const ascii = domainToASCII(value).toLowerCase().replace(/\.$/, "");
  const labels = ascii.split(".");
  if (ascii.length > 253 || labels.length < 2 || labels.some((label) => !DNS_LABEL.test(label))) return null;
  // Disallow numeric suffixes (including IP literals and their URL aliases).
  if (/^\d+$/.test(labels[labels.length - 1])) return null;
  return ascii;
}
