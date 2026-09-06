-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL,
    "studentKey" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);
