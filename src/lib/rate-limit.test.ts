import { describe, expect, test } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function limiterAt(start: number) {
  let now = start;
  const limiter = createRateLimiter(
    { limit: 3, windowMs: FIFTEEN_MINUTES },
    () => now,
  );
  return { limiter, advance: (ms: number) => (now += ms) };
}

describe("createRateLimiter", () => {
  test("allows attempts up to the limit and refuses the next", () => {
    // Arrange
    const { limiter } = limiterAt(1_000);

    // Act
    const results = [1, 2, 3, 4].map(() => limiter.check("alice"));

    // Assert
    expect(results.map((result) => result.allowed)).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  test("a refusal says how long to wait", () => {
    // Arrange
    const { limiter, advance } = limiterAt(1_000);
    limiter.check("alice");
    advance(60_000);
    limiter.check("alice");
    limiter.check("alice");

    // Act
    const refused = limiter.check("alice");

    // Assert
    expect(refused).toEqual({
      allowed: false,
      retryAfterMs: FIFTEEN_MINUTES - 60_000,
    });
  });

  test("the window resets once it has passed", () => {
    // Arrange
    const { limiter, advance } = limiterAt(1_000);
    [1, 2, 3].forEach(() => limiter.check("alice"));
    expect(limiter.check("alice").allowed).toBe(false);

    // Act
    advance(FIFTEEN_MINUTES);
    const afterWindow = limiter.check("alice");

    // Assert
    expect(afterWindow.allowed).toBe(true);
  });

  test("keys are counted separately", () => {
    // Arrange
    const { limiter } = limiterAt(1_000);
    [1, 2, 3].forEach(() => limiter.check("alice"));

    // Act
    const bob = limiter.check("bob");

    // Assert
    expect(bob.allowed).toBe(true);
  });
});

describe("createRateLimiter under a flood of keys", () => {
  test("never remembers more keys than the cap, dropping the oldest first", () => {
    // Arrange: a cap of three, one attempt per key.
    let now = 1_000;
    const limiter = createRateLimiter(
      { limit: 1, windowMs: FIFTEEN_MINUTES },
      () => now,
      3,
    );
    for (const key of ["first", "second", "third"]) {
      limiter.check(key);
      now += 1;
    }

    // Act: a fourth key pushes out "first", so "first" starts afresh, while
    // "fourth", the newest, is still remembered and still spent.
    limiter.check("fourth");
    const first = limiter.check("first");
    const fourth = limiter.check("fourth");

    // Assert
    expect(first.allowed).toBe(true);
    expect(fourth.allowed).toBe(false);
  });

  test("expired windows are dropped before live ones", () => {
    // Arrange: two keys, then the whole window passes.
    let now = 1_000;
    const limiter = createRateLimiter(
      { limit: 1, windowMs: FIFTEEN_MINUTES },
      () => now,
      3,
    );
    limiter.check("stale-a");
    limiter.check("stale-b");
    now += FIFTEEN_MINUTES;
    limiter.check("live");

    // Act: room is needed; the stale keys go, the live key stays.
    limiter.check("newcomer");
    const live = limiter.check("live");

    // Assert
    expect(live.allowed).toBe(false);
  });
});
