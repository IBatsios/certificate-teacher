import { describe, expect, test } from "vitest";
import { isTrustedOrigin } from "@/lib/origin";

describe("isTrustedOrigin", () => {
  test("trusts everything when no secret is configured", () => {
    expect(isTrustedOrigin(null, undefined)).toBe(true);
    expect(isTrustedOrigin("anything", "")).toBe(true);
  });

  test("trusts only the exact secret once one is configured", () => {
    // Arrange
    const secret = "correct-horse-battery-staple";

    // Act
    const results = [secret, "correct-horse-battery-stapl", "", null].map(
      (presented) => isTrustedOrigin(presented, secret),
    );

    // Assert
    expect(results).toEqual([true, false, false, false]);
  });
});
