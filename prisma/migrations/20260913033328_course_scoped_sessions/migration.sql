-- Learning sessions and test attempts belong to one course from here on.
--
-- Written by hand rather than generated: a required column added to a
-- populated table fails unless every existing row is given a value first.
-- Every row that exists predates the second course, so all of them belong to
-- the certificates course, and the backfill says so before the column becomes
-- required. The value is the course id in src/lib/courses.ts.

-- AlterTable
ALTER TABLE "LearningSession" ADD COLUMN "courseId" TEXT;

UPDATE "LearningSession"
SET "courseId" = 'https-with-your-own-certificates'
WHERE "courseId" IS NULL;

ALTER TABLE "LearningSession" ALTER COLUMN "courseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN "courseId" TEXT;

UPDATE "TestAttempt"
SET "courseId" = 'https-with-your-own-certificates'
WHERE "courseId" IS NULL;

ALTER TABLE "TestAttempt" ALTER COLUMN "courseId" SET NOT NULL;

-- DropIndex
DROP INDEX "LearningSession_userId_status_idx";

-- CreateIndex
CREATE INDEX "LearningSession_userId_courseId_status_idx" ON "LearningSession"("userId", "courseId", "status");
