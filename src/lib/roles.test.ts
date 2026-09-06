import { describe, expect, test } from "vitest";
import { isRole, roleForNewUser } from "@/lib/roles";

describe("roleForNewUser", () => {
  test("the admin email becomes the admin", () => {
    // Arrange
    const adminEmail = "guide@example.com";

    // Act
    const role = roleForNewUser("guide@example.com", adminEmail);

    // Assert
    expect(role).toBe("admin");
  });

  test("matching ignores case and surrounding spaces", () => {
    // Arrange
    const adminEmail = " Guide@Example.com ";

    // Act
    const role = roleForNewUser("guide@example.com", adminEmail);

    // Assert
    expect(role).toBe("admin");
  });

  test("any other email becomes a student", () => {
    // Arrange
    const adminEmail = "guide@example.com";

    // Act
    const role = roleForNewUser("learner@example.com", adminEmail);

    // Assert
    expect(role).toBe("student");
  });

  test("with no admin email configured, everyone is a student", () => {
    // Arrange
    const adminEmail = undefined;

    // Act
    const role = roleForNewUser("guide@example.com", adminEmail);

    // Assert
    expect(role).toBe("student");
  });
});

describe("isRole", () => {
  test("accepts the two roles", () => {
    // Arrange
    const values = ["student", "admin"];

    // Act
    const results = values.map((value) => isRole(value));

    // Assert
    expect(results).toEqual([true, true]);
  });

  test("rejects anything else, including a role with different casing", () => {
    // Arrange
    const values = ["Admin", "", undefined, null, 42, {}];

    // Act
    const results = values.map((value) => isRole(value));

    // Assert
    expect(results).toEqual([false, false, false, false, false, false]);
  });
});
