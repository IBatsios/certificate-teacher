export type RateLimitRule = Readonly<{
  /** Attempts allowed per key within one window. */
  limit: number;
  windowMs: number;
}>;

export type RateLimitResult =
  | Readonly<{ allowed: true }>
  | Readonly<{ allowed: false; retryAfterMs: number }>;

export type RateLimiter = Readonly<{
  /** Records one attempt for `key` and says whether it may go ahead. */
  check: (key: string) => RateLimitResult;
}>;

/**
 * The most keys a limiter remembers. Keys come from the outside (addresses,
 * emails), so without a cap a flood of made-up ones would grow the map for
 * the length of a window. Past the cap the oldest window is dropped, which
 * is what a flood deserves and costs a real visitor at most one free try.
 */
export const MAX_KEYS = 10_000;

type Window = { startedAt: number; count: number };

/**
 * A fixed-window counter in memory. Counts live in this process only, which
 * is right for one Railway instance and resets on every deploy (D39). The
 * clock is injectable for tests.
 */
export function createRateLimiter(
  rule: RateLimitRule,
  now: () => number = Date.now,
  maxKeys: number = MAX_KEYS,
): RateLimiter {
  // Insertion order is oldest first, which is the eviction order.
  const windows = new Map<string, Window>();

  function check(key: string): RateLimitResult {
    const time = now();
    const current = windows.get(key);
    if (current === undefined || time - current.startedAt >= rule.windowMs) {
      windows.delete(key);
      makeRoom(time);
      windows.set(key, { startedAt: time, count: 1 });
      return { allowed: true };
    }
    if (current.count >= rule.limit) {
      return {
        allowed: false,
        retryAfterMs: current.startedAt + rule.windowMs - time,
      };
    }
    windows.set(key, { ...current, count: current.count + 1 });
    return { allowed: true };
  }

  /** Keeps the map under the cap: expired windows first, then the oldest. */
  function makeRoom(time: number): void {
    if (windows.size < maxKeys) {
      return;
    }
    for (const [key, window] of windows) {
      if (time - window.startedAt >= rule.windowMs) {
        windows.delete(key);
      }
    }
    while (windows.size >= maxKeys) {
      const oldest = windows.keys().next();
      if (oldest.done) {
        return;
      }
      windows.delete(oldest.value);
    }
  }

  return { check };
}
