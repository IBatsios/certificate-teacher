import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  CERTIFICATE_CHECKS,
  checkCertificate,
  parseCertificate,
} from "@/lib/certificate";

const FIXTURES = path.join(process.cwd(), "src", "lib", "__fixtures__");

function fixture(name: string): string {
  return readFileSync(path.join(FIXTURES, name), "utf8");
}

const goodRoot = fixture("good-root.crt");
const goodLeaf = fixture("good-leaf.crt");
const expiredLeaf = fixture("expired-leaf.crt");
const foreignLeaf = fixture("foreign-leaf.crt");
const otherRoot = fixture("other-root.crt");

// No real key material lives in the repository. The refusal is a scan of the
// submitted text, so a block that merely looks like a key exercises it exactly
// as a real one would.
const FAKE_KEY_BLOCK = [
  "-----BEGIN PRIVATE KEY-----",
  "bm90IGEgcmVhbCBrZXksIGp1c3QgZW5vdWdoIHRvIGxvb2sgbGlrZSBvbmU=",
  "-----END PRIVATE KEY-----",
].join("\n");

describe("parseCertificate", () => {
  test("reads the fields a student is shown", () => {
    // Act
    const result = parseCertificate(goodLeaf);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.certificate.subject).toContain("CN=localhost");
    expect(result.certificate.issuer).toContain("CN=My Root");
    expect(result.certificate.notAfter.getUTCFullYear()).toBe(2126);
  });

  test.each([
    ["empty text", ""],
    ["only whitespace", "   \n  "],
    ["prose", "here is my certificate, please check it"],
    [
      "a truncated block",
      "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----",
    ],
  ])("refuses %s without throwing", (_name, input) => {
    const result = parseCertificate(input);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("not-a-certificate");
  });

  test("refuses anything holding a private key", () => {
    const result = parseCertificate(FAKE_KEY_BLOCK);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("contains-private-key");
  });

  /**
   * The reason this check cannot be left to the parser: Node reads the first
   * PEM block and ignores the rest, so a certificate with a key pasted after
   * it parses perfectly well and would be stored key and all.
   */
  test("refuses a certificate with a private key pasted after it", () => {
    const combined = `${goodLeaf}\n${FAKE_KEY_BLOCK}\n`;

    const result = parseCertificate(combined);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("contains-private-key");
  });

  test("refuses a private key however it is written", () => {
    for (const label of [
      "RSA PRIVATE KEY",
      "EC PRIVATE KEY",
      "OPENSSH PRIVATE KEY",
      "ENCRYPTED PRIVATE KEY",
    ]) {
      const text = `-----BEGIN ${label}-----\nAAAA\n-----END ${label}-----`;

      const result = parseCertificate(text);

      expect(result.ok, label).toBe(false);
      if (result.ok) return;
      expect(result.reason, label).toBe("contains-private-key");
    }
  });

  /**
   * A submission can carry anything around the PEM block and still parse.
   * What gets stored is Node's re-encoding, so none of that is kept.
   */
  test("keeps the certificate itself, not the text sent around it", () => {
    // Arrange
    const noisy = `please check this for me
${goodLeaf}
thanks!
`;

    // Act
    const result = parseCertificate(noisy);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.certificate.pem).toContain("BEGIN CERTIFICATE");
    expect(result.certificate.pem).not.toContain("please check this");
    expect(result.certificate.pem).not.toContain("thanks!");
  });

  test("refuses text far larger than any certificate", () => {
    const result = parseCertificate("A".repeat(200_000));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("too-large");
  });
});

describe("checkCertificate", () => {
  test("the pair the lesson produces passes every check", () => {
    // Act
    const report = checkCertificate(goodLeaf, goodRoot);

    // Assert
    expect(report.verdict).toBe("passed");
    expect(report.failed).toEqual([]);
    expect(report.results).toHaveLength(CERTIFICATE_CHECKS.length);
    expect(report.results.every((result) => result.passed)).toBe(true);
  });

  test("an expired leaf fails only the dates check", () => {
    const report = checkCertificate(expiredLeaf, goodRoot);

    expect(report.verdict).toBe("failed");
    expect(report.failed).toEqual(["leaf-in-date"]);
  });

  test("a leaf signed by another root fails the signature and the issuer", () => {
    const report = checkCertificate(foreignLeaf, goodRoot);

    expect(report.verdict).toBe("failed");
    expect(report.failed).toContain("signed-by-your-root");
    expect(report.failed).toContain("issued-by-your-root");
  });

  /**
   * The check that actually matters. A certificate can name your root as its
   * issuer without your root having signed it; only the signature proves it.
   */
  test("a leaf that names your root but was signed by another fails", () => {
    // Arrange: foreign-leaf names CN=Someone Elses Root, so forge the reverse
    // by checking the good leaf against a root it does not belong to.
    const report = checkCertificate(goodLeaf, otherRoot);

    // Assert
    expect(report.verdict).toBe("failed");
    expect(report.failed).toContain("signed-by-your-root");
  });

  test("a root submitted where the leaf belongs is refused as a leaf", () => {
    const report = checkCertificate(goodRoot, goodRoot);

    expect(report.verdict).toBe("failed");
    expect(report.failed).toContain("leaf-is-not-a-root");
  });

  test("a leaf submitted where the root belongs fails the root checks", () => {
    const report = checkCertificate(goodLeaf, goodLeaf);

    expect(report.verdict).toBe("failed");
    expect(report.failed).toContain("root-is-self-signed");
  });

  test("every check has a name and a sentence a student can act on", () => {
    for (const check of CERTIFICATE_CHECKS) {
      expect(check.key).toMatch(/^[a-z-]+$/);
      expect(check.title.length).toBeGreaterThan(0);
      expect(check.whenFailed.length).toBeGreaterThan(0);
    }
  });
});
