-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN     "correct" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "focusAreas" TEXT[],
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "total" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "TestAttempt_sessionId_createdAt_idx" ON "TestAttempt"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
