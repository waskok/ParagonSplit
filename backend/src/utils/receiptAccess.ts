import fs from "fs";
import path from "path";
import { prisma } from "../config/prisma";
import { uploadsDirectory } from "../config/upload";
import { isGroupMember } from "./groupAccess";

export const getReceiptForUser = async (receiptId: string, userId: string) => {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      items: true,
      uploadedBy: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } }
    }
  });

  if (!receipt) return null;

  const member = await isGroupMember(receipt.groupId, userId);
  if (!member) return null;

  return receipt;
};

export const recalculateReceiptTotal = async (receiptId: string) => {
  const items = await prisma.receiptItem.findMany({ where: { receiptId } });
  const total =
    items.length > 0
      ? Number(items.reduce((sum, item) => sum + Number(item.totalPrice), 0).toFixed(2))
      : null;

  return prisma.receipt.update({
    where: { id: receiptId },
    data: { total },
    include: {
      items: { orderBy: { name: "asc" } },
      uploadedBy: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } }
    }
  });
};

export const deleteReceiptImage = (imagePath: string) => {
  const fullPath = path.join(uploadsDirectory, imagePath);
  fs.unlink(fullPath, () => undefined);
};
