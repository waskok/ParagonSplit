-- CreateTable
CREATE TABLE "OcrApiCall" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcrApiCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OcrApiCall_createdAt_idx" ON "OcrApiCall"("createdAt");
