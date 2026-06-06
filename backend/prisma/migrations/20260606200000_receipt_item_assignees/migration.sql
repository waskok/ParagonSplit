CREATE TABLE "ReceiptItemAssignee" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptItemAssignee_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ReceiptItemAssignee" ("id", "itemId", "userId", "createdAt")
SELECT
  'm_' || "id" || '_' || "assignedToId",
  "id",
  "assignedToId",
  CURRENT_TIMESTAMP
FROM "ReceiptItem"
WHERE "assignedToId" IS NOT NULL;

INSERT INTO "ReceiptItemAssignee" ("id", "itemId", "userId", "createdAt")
SELECT
  'm_' || ri."id" || '_' || r."uploadedById",
  ri."id",
  r."uploadedById",
  CURRENT_TIMESTAMP
FROM "ReceiptItem" ri
JOIN "Receipt" r ON r."id" = ri."receiptId"
WHERE ri."assignedToId" IS NULL;

ALTER TABLE "ReceiptItem" DROP CONSTRAINT IF EXISTS "ReceiptItem_assignedToId_fkey";
ALTER TABLE "ReceiptItem" DROP COLUMN "assignedToId";

CREATE UNIQUE INDEX "ReceiptItemAssignee_itemId_userId_key" ON "ReceiptItemAssignee"("itemId", "userId");

ALTER TABLE "ReceiptItemAssignee" ADD CONSTRAINT "ReceiptItemAssignee_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "ReceiptItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReceiptItemAssignee" ADD CONSTRAINT "ReceiptItemAssignee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
