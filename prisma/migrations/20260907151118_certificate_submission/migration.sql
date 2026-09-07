-- CreateEnum
CREATE TYPE "CertificateVerdict" AS ENUM ('passed', 'failed');

-- CreateTable
CREATE TABLE "CertificateSubmission" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "certificatePem" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "notBefore" TIMESTAMP(3) NOT NULL,
    "notAfter" TIMESTAMP(3) NOT NULL,
    "verdict" "CertificateVerdict" NOT NULL,
    "failedChecks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificateSubmission_sessionId_createdAt_idx" ON "CertificateSubmission"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "CertificateSubmission" ADD CONSTRAINT "CertificateSubmission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
