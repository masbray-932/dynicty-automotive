const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 5 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_KEYS = 1000;

type Attempt = { failures: number; windowStartedAt: number; blockedUntil: number };
const attempts = new Map<string, Attempt>();

function compact(now: number) {
  for (const [key, value] of attempts) {
    if (value.blockedUntil <= now && now - value.windowStartedAt > WINDOW_MS) attempts.delete(key);
  }
  while (attempts.size >= MAX_KEYS) attempts.delete(attempts.keys().next().value!);
}

export function loginLimitState(key: string, now = Date.now()) {
  const value = attempts.get(key);
  if (!value || value.blockedUntil <= now) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.ceil((value.blockedUntil - now) / 1000) };
}

export function recordLoginFailure(key: string, now = Date.now()) {
  compact(now);
  const existing = attempts.get(key);
  const current = !existing || now - existing.windowStartedAt > WINDOW_MS
    ? { failures: 0, windowStartedAt: now, blockedUntil: 0 }
    : existing;
  current.failures += 1;
  if (current.failures >= MAX_FAILURES) current.blockedUntil = now + BLOCK_MS;
  attempts.set(key, current);
  return loginLimitState(key, now);
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}

export function resetLoginLimiterForTests() {
  attempts.clear();
}
