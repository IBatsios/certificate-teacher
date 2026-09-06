import { describe, expect, test } from "vitest";
import { decideRoleChange } from "@/lib/role-change";

const requesterId = "admin-1";

describe("decideRoleChange", () => {
  test("promotes a student to admin", () => {
    // Arrange
    const request = {
      requesterId,
      target: { id: "student-1", role: "student" as const },
      newRole: "admin" as const,
      adminCount: 1,
    };

    // Act
    const decision = decideRoleChange(request);

    // Assert
    expect(decision).toEqual({ kind: "change" });
  });

  test("demotes an admin when another admin remains", () => {
    // Arrange
    const request = {
      requesterId,
      target: { id: "admin-2", role: "admin" as const },
      newRole: "student" as const,
      adminCount: 2,
    };

    // Act
    const decision = decideRoleChange(request);

    // Assert
    expect(decision).toEqual({ kind: "change" });
  });

  test("refuses to demote the last admin", () => {
    // Arrange
    const request = {
      requesterId,
      target: { id: "admin-2", role: "admin" as const },
      newRole: "student" as const,
      adminCount: 1,
    };

    // Act
    const decision = decideRoleChange(request);

    // Assert
    expect(decision).toEqual({ kind: "refuse", reason: "last-admin" });
  });

  test("refuses an admin changing their own role, even with others around", () => {
    // Arrange
    const request = {
      requesterId,
      target: { id: requesterId, role: "admin" as const },
      newRole: "student" as const,
      adminCount: 3,
    };

    // Act
    const decision = decideRoleChange(request);

    // Assert
    expect(decision).toEqual({ kind: "refuse", reason: "own-role" });
  });

  test("refuses when the person is not found", () => {
    // Arrange
    const request = {
      requesterId,
      target: null,
      newRole: "admin" as const,
      adminCount: 1,
    };

    // Act
    const decision = decideRoleChange(request);

    // Assert
    expect(decision).toEqual({ kind: "refuse", reason: "not-found" });
  });

  test("refuses when the person already has that role", () => {
    // Arrange
    const request = {
      requesterId,
      target: { id: "student-1", role: "student" as const },
      newRole: "student" as const,
      adminCount: 1,
    };

    // Act
    const decision = decideRoleChange(request);

    // Assert
    expect(decision).toEqual({ kind: "refuse", reason: "unchanged" });
  });
});
