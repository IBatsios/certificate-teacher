import { describe, expect, test } from "vitest";
import { decideAccess } from "@/lib/access";

describe("decideAccess for a visitor who is not signed in", () => {
  test("sends them to sign-in from the test page", () => {
    // Arrange
    const role = null;

    // Act
    const decision = decideAccess("/test", role);

    // Assert
    expect(decision).toEqual({ kind: "redirect", to: "/sign-in" });
  });

  test("lets them open the sign-in and sign-up pages", () => {
    // Arrange
    const role = null;

    // Act
    const decisions = ["/sign-in", "/sign-up"].map((path) =>
      decideAccess(path, role),
    );

    // Assert
    expect(decisions).toEqual([{ kind: "allow" }, { kind: "allow" }]);
  });
});

describe("decideAccess for a student", () => {
  test("lets them open the lessons, the test page, and its results", () => {
    // Arrange
    const role = "student";

    // Act
    const decisions = ["/lessons/certificates", "/test", "/test/anything"].map(
      (path) => decideAccess(path, role),
    );

    // Assert
    expect(decisions).toEqual([
      { kind: "allow" },
      { kind: "allow" },
      { kind: "allow" },
    ]);
  });

  test("forbids the admin pages", () => {
    // Arrange
    const role = "student";

    // Act
    const decision = decideAccess("/admin/users", role);

    // Assert
    expect(decision).toEqual({ kind: "forbid" });
  });

  test("sends them from sign-in to the certificates lesson, their home", () => {
    // Arrange
    const role = "student";

    // Act
    const decision = decideAccess("/sign-in", role);

    // Assert
    expect(decision).toEqual({ kind: "redirect", to: "/lessons/certificates" });
  });
});

describe("decideAccess for the admin", () => {
  test("lets them open the admin pages", () => {
    // Arrange
    const role = "admin";

    // Act
    const decisions = ["/admin", "/admin/users"].map((path) =>
      decideAccess(path, role),
    );

    // Assert
    expect(decisions).toEqual([{ kind: "allow" }, { kind: "allow" }]);
  });

  test("forbids the lessons and the test page, which are for students", () => {
    // Arrange
    const role = "admin";

    // Act
    const decisions = ["/lessons/certificates", "/test"].map((path) =>
      decideAccess(path, role),
    );

    // Assert
    expect(decisions).toEqual([{ kind: "forbid" }, { kind: "forbid" }]);
  });

  test("sends them from sign-up to the users page, their home", () => {
    // Arrange
    const role = "admin";

    // Act
    const decision = decideAccess("/sign-up", role);

    // Assert
    expect(decision).toEqual({ kind: "redirect", to: "/admin/users" });
  });
});

describe("decideAccess on pages open to everyone", () => {
  test("lets a visitor open the home page and the pages sign-in links to", () => {
    // Arrange
    const role = null;

    // Act
    const decisions = ["/", "/check-your-email", "/forbidden"].map((path) =>
      decideAccess(path, role),
    );

    // Assert
    expect(decisions).toEqual([
      { kind: "allow" },
      { kind: "allow" },
      { kind: "allow" },
    ]);
  });
});
