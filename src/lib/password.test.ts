import { describe, expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("passwords", () => {
  test("a hash verifies against the password it was made from", async () => {
    // Arrange
    const password = "correct horse battery staple";
    const hash = await hashPassword(password);

    // Act
    const matches = await verifyPassword(hash, password);

    // Assert
    expect(matches).toBe(true);
  });

  test("a hash does not verify against a different password", async () => {
    // Arrange
    const hash = await hashPassword("correct horse battery staple");

    // Act
    const matches = await verifyPassword(hash, "correct horse battery stable");

    // Assert
    expect(matches).toBe(false);
  });

  test("the hash never contains the password", async () => {
    // Arrange
    const password = "correct horse battery staple";

    // Act
    const hash = await hashPassword(password);

    // Assert
    expect(hash).not.toContain(password);
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });
});
