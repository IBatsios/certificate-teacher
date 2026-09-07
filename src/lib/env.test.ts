import { describe, expect, test } from "vitest";
import {
  emailTransport,
  missingEmailVariables,
  missingProductionVariables,
} from "@/lib/env";

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

describe("emailTransport", () => {
  test("uses Nodemailer when no Resend key is set, so development keeps Mailpit", () => {
    expect(emailTransport({ EMAIL_SERVER: "smtp://localhost:1025" })).toBe(
      "nodemailer",
    );
  });

  test("uses Resend's HTTPS API once a key is set", () => {
    // Arrange
    const env = { AUTH_RESEND_KEY: "re_test", EMAIL_FROM: "t@example.com" };

    // Act
    const transport = emailTransport(env);

    // Assert
    expect(transport).toBe("resend");
  });

  test("ignores a blank key, which is how the browser tests opt out", () => {
    // Arrange
    const env = {
      AUTH_RESEND_KEY: "  ",
      EMAIL_SERVER: "smtp://localhost:1025",
    };

    // Act
    const transport = emailTransport(env);

    // Assert
    expect(transport).toBe("nodemailer");
  });

  test("prefers Resend even when an SMTP server is also configured", () => {
    // Arrange
    const env = {
      AUTH_RESEND_KEY: "re_test",
      EMAIL_SERVER: "smtp://localhost:1025",
    };

    // Act
    const transport = emailTransport(env);

    // Assert
    expect(transport).toBe("resend");
  });
});

describe("missingEmailVariables", () => {
  test("names the Resend key's partner when only the key is set", () => {
    expect(missingEmailVariables({ AUTH_RESEND_KEY: "re_test" })).toEqual([
      "EMAIL_FROM",
    ]);
  });

  test("names the SMTP server when nothing is set at all", () => {
    expect(missingEmailVariables({})).toEqual(["EMAIL_SERVER", "EMAIL_FROM"]);
  });

  test("is satisfied by a complete Resend setup", () => {
    // Arrange
    const env = { AUTH_RESEND_KEY: "re_test", EMAIL_FROM: "t@example.com" };

    // Act & Assert
    expect(missingEmailVariables(env)).toEqual([]);
  });

  test("is satisfied by a complete SMTP setup", () => {
    // Arrange
    const env = {
      EMAIL_SERVER: "smtp://localhost:1025",
      EMAIL_FROM: "t@example.com",
    };

    // Act & Assert
    expect(missingEmailVariables(env)).toEqual([]);
  });
});
