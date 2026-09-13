import { Prisma } from "@/generated/prisma/client";
import type { CertificateVerdict } from "@/generated/prisma/enums";
import type {
  CertificateCheckKey,
  CertificateReport,
  ParsedCertificate,
} from "@/lib/certificate";
import { activeSessionId, findActiveSessionId } from "@/lib/learning-session";
import { prisma } from "@/lib/prisma";

export type SubmissionSummary = Readonly<{
  id: string;
  subject: string;
  issuer: string;
  notBefore: Date;
  notAfter: Date;
  verdict: CertificateVerdict;
  failedChecks: ReadonlyArray<CertificateCheckKey>;
  createdAt: Date;
}>;

const SUMMARY_SELECT = {
  id: true,
  subject: true,
  issuer: true,
  notBefore: true,
  notAfter: true,
  verdict: true,
  failedChecks: true,
  createdAt: true,
} satisfies Prisma.CertificateSubmissionSelect;

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

// The same guard as in certificate.ts. It is repeated here rather than assumed
// because this is the last point before the text reaches the database, and a
// caller that forgot to check must fail loudly instead of storing a key.
const PRIVATE_KEY_LABEL = /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/;

/**
 * Stores one verdict against the student's active session in the course,
 * creating the session when they have none. Finding the session and writing
 * the submission share a transaction, so a "start over" from another tab
 * cannot leave the submission on the session that was just archived.
 */
export async function saveSubmission(
  userId: string,
  courseId: string,
  certificate: ParsedCertificate,
  report: CertificateReport,
): Promise<SubmissionSummary> {
  if (PRIVATE_KEY_LABEL.test(certificate.pem)) {
    throw new Error(
      "Refusing to store a submission that contains a private key.",
    );
  }
  return prisma.$transaction(async (tx) => {
    const sessionId = await activeSessionId(tx, userId, courseId);
    const row = await tx.certificateSubmission.create({
      data: {
        sessionId,
        certificatePem: certificate.pem,
        subject: certificate.subject,
        issuer: certificate.issuer,
        notBefore: certificate.notBefore,
        notAfter: certificate.notAfter,
        verdict: report.verdict,
        failedChecks: [...report.failed],
      },
      select: SUMMARY_SELECT,
    });
    return toSummary(row);
  }, SERIALIZABLE);
}

/** The submissions in the student's active session in the course, newest first. */
export async function listSubmissions(
  userId: string,
  courseId: string,
): Promise<ReadonlyArray<SubmissionSummary>> {
  const sessionId = await findActiveSessionId(userId, courseId);
  if (sessionId === null) {
    return [];
  }
  const rows = await prisma.certificateSubmission.findMany({
    where: { sessionId },
    select: SUMMARY_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toSummary);
}

function toSummary(
  row: Prisma.CertificateSubmissionGetPayload<{
    select: typeof SUMMARY_SELECT;
  }>,
): SubmissionSummary {
  return {
    id: row.id,
    subject: row.subject,
    issuer: row.issuer,
    notBefore: row.notBefore,
    notAfter: row.notAfter,
    verdict: row.verdict,
    failedChecks: row.failedChecks as ReadonlyArray<CertificateCheckKey>,
    createdAt: row.createdAt,
  };
}
