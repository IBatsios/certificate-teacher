import { X509Certificate } from "node:crypto";

// Reading and judging a certificate a student submitted. Pure: no database, no
// request, no clock beyond the one passed in. Node's own X509 reader does the
// work, so nothing here parses ASN.1 by hand and no dependency is added to the
// one path in the app that accepts a file from a stranger.

/** Far above any certificate; a PEM leaf is a couple of kilobytes. */
export const MAX_CERTIFICATE_BYTES = 16 * 1024;

// Every PEM label that carries key material. A submission holding any of them
// is refused whole and never stored, whatever else it contains.
const PRIVATE_KEY_LABEL = /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/;

export type ParsedCertificate = Readonly<{
  subject: string;
  issuer: string;
  notBefore: Date;
  notAfter: Date;
  subjectAltName: string | undefined;
  isCertificateAuthority: boolean;
  pem: string;
}>;

export type ParseFailureReason =
  "contains-private-key" | "not-a-certificate" | "too-large";

export type ParseResult =
  | Readonly<{ ok: true; certificate: ParsedCertificate }>
  | Readonly<{ ok: false; reason: ParseFailureReason }>;

export type CertificateCheckKey =
  | "leaf-is-not-a-root"
  | "issued-by-your-root"
  | "signed-by-your-root"
  | "leaf-in-date"
  | "names-localhost"
  | "root-is-self-signed"
  | "root-can-sign";

export type CertificateCheck = Readonly<{
  key: CertificateCheckKey;
  /** What the check looks for, in the student's words. */
  title: string;
  /** What to do about it, shown only when the check fails. */
  whenFailed: string;
}>;

/**
 * Every check, in the order a student reads them. Exported so the lesson and
 * the page describe the same list and cannot drift apart.
 */
export const CERTIFICATE_CHECKS: ReadonlyArray<CertificateCheck> = [
  {
    key: "root-is-self-signed",
    title: "Your root signed itself",
    whenFailed:
      "The file you gave as your root is not a root. A root's subject and issuer are the same, and its own key signs it. Check you sent my-root.crt and not localhost.crt.",
  },
  {
    key: "root-can-sign",
    title: "Your root is allowed to sign other certificates",
    whenFailed:
      "This certificate is not marked as a certificate authority, so nothing will accept certificates it signs. Make the root again with the command from the certificates lesson.",
  },
  {
    key: "leaf-is-not-a-root",
    title: "Your certificate is a leaf, not another root",
    whenFailed:
      "You sent the same kind of file twice. The second one should be localhost.crt, the certificate your root signed, not the root itself.",
  },
  {
    key: "issued-by-your-root",
    title: "It names your root as its issuer",
    whenFailed:
      "This certificate says it was issued by someone else. Check you signed it with your own root, using the -CA and -CAkey options from the lesson.",
  },
  {
    key: "signed-by-your-root",
    title: "Your root's signature on it is genuine",
    whenFailed:
      "The name on it matches your root, but the signature does not. A certificate can claim any issuer it likes; only the signature settles it. Sign it again with your root.",
  },
  {
    key: "leaf-in-date",
    title: "It is valid today",
    whenFailed:
      "This certificate is expired or not valid yet. Make it again; the lesson's command gives it a little over two years.",
  },
  {
    key: "names-localhost",
    title: "It is for localhost",
    whenFailed:
      "Browsers only trust the subject alternative name, and this one does not list localhost. Redo the step that writes localhost.ext and sign the certificate again with -extfile.",
  },
];

export type CertificateCheckResult = Readonly<{
  key: CertificateCheckKey;
  passed: boolean;
}>;

export type CertificateReport = Readonly<{
  verdict: "passed" | "failed";
  results: ReadonlyArray<CertificateCheckResult>;
  /** The keys that failed, in the order they are shown. */
  failed: ReadonlyArray<CertificateCheckKey>;
}>;

/**
 * Reads submitted text as one certificate.
 *
 * The private key scan runs on the raw text, before anything is parsed, and
 * that ordering is the point. Node reads the first PEM block and ignores
 * whatever follows, so a certificate with a key pasted after it parses
 * perfectly well; trusting the parser to notice would store the key.
 */
export function parseCertificate(text: string): ParseResult {
  if (Buffer.byteLength(text, "utf8") > MAX_CERTIFICATE_BYTES) {
    return { ok: false, reason: "too-large" };
  }
  if (PRIVATE_KEY_LABEL.test(text)) {
    return { ok: false, reason: "contains-private-key" };
  }
  const trimmed = text.trim();
  if (trimmed === "") {
    return { ok: false, reason: "not-a-certificate" };
  }
  try {
    const certificate = new X509Certificate(trimmed);
    return { ok: true, certificate: toParsed(certificate) };
  } catch {
    // Node reports OpenSSL's own wording, such as "PEM routines::no start
    // line", which means nothing to this audience and is not shown.
    return { ok: false, reason: "not-a-certificate" };
  }
}

/**
 * Judges a leaf against the root the student says signed it. Both are given as
 * PEM text and are assumed to have passed `parseCertificate` already; anything
 * that fails to parse here counts as failing every check that needed it.
 */
export function checkCertificate(
  leafPem: string,
  rootPem: string,
  now: Date = new Date(),
): CertificateReport {
  const leaf = read(leafPem);
  const root = read(rootPem);

  const passed: Readonly<Record<CertificateCheckKey, boolean>> = {
    "root-is-self-signed": root !== null && isSelfSigned(root),
    "root-can-sign": root !== null && root.ca,
    "leaf-is-not-a-root": leaf !== null && !isSelfSigned(leaf),
    "issued-by-your-root":
      leaf !== null && root !== null && namesIssuer(leaf, root),
    "signed-by-your-root":
      leaf !== null && root !== null && isSignedBy(leaf, root),
    "leaf-in-date": leaf !== null && isInDate(leaf, now),
    "names-localhost": leaf !== null && namesLocalhost(leaf),
  };

  const results = CERTIFICATE_CHECKS.map((check) => ({
    key: check.key,
    passed: passed[check.key],
  }));
  const failed = results
    .filter((result) => !result.passed)
    .map((result) => result.key);

  return {
    verdict: failed.length === 0 ? "passed" : "failed",
    results,
    failed,
  };
}

function read(pem: string): X509Certificate | null {
  try {
    return new X509Certificate(pem.trim());
  } catch {
    return null;
  }
}

function isSelfSigned(certificate: X509Certificate): boolean {
  return (
    certificate.subject === certificate.issuer &&
    certificate.verify(certificate.publicKey)
  );
}

function namesIssuer(leaf: X509Certificate, root: X509Certificate): boolean {
  return leaf.checkIssued(root);
}

/** The signature itself, which is the only thing a forged issuer name cannot fake. */
function isSignedBy(leaf: X509Certificate, root: X509Certificate): boolean {
  try {
    return leaf.verify(root.publicKey);
  } catch {
    return false;
  }
}

function isInDate(certificate: X509Certificate, now: Date): boolean {
  return (
    new Date(certificate.validFrom) <= now &&
    now <= new Date(certificate.validTo)
  );
}

function namesLocalhost(certificate: X509Certificate): boolean {
  const names = certificate.subjectAltName ?? "";
  return names
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .includes("dns:localhost");
}

/**
 * The certificate as Node re-encodes it, not the text that was submitted.
 * A submission may carry anything around the PEM block and still parse, and
 * none of that has any business being stored.
 */
function toParsed(certificate: X509Certificate): ParsedCertificate {
  return {
    subject: certificate.subject,
    issuer: certificate.issuer,
    notBefore: new Date(certificate.validFrom),
    notAfter: new Date(certificate.validTo),
    subjectAltName: certificate.subjectAltName,
    isCertificateAuthority: certificate.ca,
    pem: certificate.toString(),
  };
}
