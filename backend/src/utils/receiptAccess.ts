import fs from "fs";
import path from "path";
import { prisma } from "../config/prisma";
import { uploadsDirectory } from "../config/upload";
import { isGroupMember } from "./groupAccess";

export const receiptItemInclude = {
  assignees: {
    include: {
      user: { select: { id: true, username: true } }
    }
  }
};

export const receiptDetailInclude = {
  items: { include: receiptItemInclude, orderBy: { name: "asc" as const } },
  uploadedBy: { select: { id: true, username: true } },
  group: {
    select: {
      id: true,
      name: true,
      members: {
        select: {
          id: true,
          role: true,
          user: { select: { id: true, username: true, email: true } }
        }
      }
    }
  }
};

export const getReceiptForUser = async (receiptId: string, userId: string) => {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: receiptDetailInclude
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
    include: receiptDetailInclude
  });
};

export const deleteReceiptImage = (imagePath: string) => {
  const fullPath = path.join(uploadsDirectory, imagePath);
  fs.unlink(fullPath, () => undefined);
};
