import { describe, expect, test } from "vitest";
import { missingProductionVariables } from "@/lib/env";

describe("missingProductionVariables", () => {
  test("asks for nothing in development, where the host is not trusted", () => {
    expect(missingProductionVariables({})).toEqual([]);
  });

  test("names what a trusted-host deployment still lacks", () => {
    // Arrange
    const env = { AUTH_TRUST_HOST: "true", AUTH_URL: "https://t.example" };

    // Act
    const missing = missingProductionVariables(env);

    // Assert
    expect(missing).toEqual(["ORIGIN_SECRET"]);
  });

  test("is satisfied when both are present", () => {
    // Arrange
    const env = {
      AUTH_TRUST_HOST: "true",
      AUTH_URL: "https://t.example",
      ORIGIN_SECRET: "s",
    };

    // Act
    const missing = missingProductionVariables(env);

    // Assert
    expect(missing).toEqual([]);
  });
});
