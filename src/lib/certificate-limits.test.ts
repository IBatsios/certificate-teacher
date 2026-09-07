import { describe, expect, test } from "vitest";
import {
  allowCertificateCheckFrom,
  CERTIFICATE_CHECK_LIMITS,
} from "@/lib/certificate-limits";

// The limiters are one per process and hold real time, so there is nothing to
// reset between tests. Every test uses names no other test uses instead, which
// is also how the limiter is keyed in production.
let counter = 0;
function unique(what: string): string {
  counter += 1;
  return `${what}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Runs `count` checks and returns how many were allowed. */
function attempt(userId: string, address: string, count: number): number {
  let allowed = 0;
  for (let index = 0; index < count; index += 1) {
    if (allowCertificateCheckFrom(userId, address)) {
      allowed += 1;
    }
  }
  return allowed;
}

const { perStudent, perAddress } = CERTIFICATE_CHECK_LIMITS;

describe("allowCertificateCheckFrom", () => {
  test("a student may check up to the limit, and the next is refused", () => {
    // Arrange
    const student = unique("student");
    const address = unique("address");

    // Act
    const allowed = attempt(student, address, perStudent);

    // Assert
    expect(allowed).toBe(perStudent);
    expect(allowCertificateCheckFrom(student, address)).toBe(false);
  });

  test("one student running out does not stop another", () => {
    // Arrange
    const address = unique("address");
    const first = unique("student");
    attempt(first, address, perStudent + 5);

    // Act
    const second = unique("student");
    const allowed = allowCertificateCheckFrom(second, address);

    // Assert
    expect(allowed).toBe(true);
  });

  test("the address runs out even for students who never used theirs", () => {
    // Arrange: spend the whole address budget across fresh students, so no
    // student limit is ever the thing that refuses.
    const address = unique("address");
    for (let spent = 0; spent < perAddress; spent += perStudent) {
      attempt(unique("student"), address, perStudent);
    }

    // Act
    const newcomer = unique("student");

    // Assert
    expect(allowCertificateCheckFrom(newcomer, address)).toBe(false);
  });

  /**
   * Pins the decision not to short-circuit. An attempt the student limit
   * refuses was still an attempt from that address, and counting it is what
   * stops a blocked student from becoming free traffic.
   */
  test("an attempt refused by the student limit still counts against the address", () => {
    // Arrange
    const address = unique("address");
    const blocked = unique("student");
    const over = 5;
    attempt(blocked, address, perStudent + over);

    // Act: a fresh student sees what is left of the address budget.
    const fresh = unique("student");
    const remaining = attempt(fresh, address, perAddress);

    // Assert: the refused attempts were counted, so fewer are left than if
    // only the allowed ones had been.
    expect(remaining).toBe(perAddress - perStudent - over);
  });

  test("a different address is unaffected", () => {
    const student = unique("student");
    attempt(student, unique("address"), perStudent);

    // The student limit is spent, so this is refused by the student, not the
    // address: a genuinely new student on the new address still gets through.
    expect(
      allowCertificateCheckFrom(unique("student"), unique("address")),
    ).toBe(true);
  });
});
