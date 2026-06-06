ALTER TABLE "ReceiptItem" ADD COLUMN "assignedToId" TEXT;

ALTER TABLE "ReceiptItem" ADD CONSTRAINT "ReceiptItem_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
