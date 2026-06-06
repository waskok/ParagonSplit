import fs from "fs";
import { type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { OcrQuotaError, reserveOcrCall } from "../services/ocrQuotaService";
import { extractTextFromImage } from "../services/visionService";
import { isGroupMember } from "../utils/groupAccess";
import { parseReceiptText } from "../utils/receiptParser";
import {
  deleteReceiptImage,
  getReceiptForUser,
  receiptDetailInclude,
  recalculateReceiptTotal
} from "../utils/receiptAccess";

export const scanReceipt = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const groupId = req.body.groupId as string | undefined;
    const title = (req.body.title as string | undefined)?.trim() || null;

    if (!groupId) {
      return res.status(400).json({ message: "Brak identyfikatora grupy." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Brak zdjęcia paragonu." });
    }

    const member = await isGroupMember(groupId, userId);
    if (!member) {
      fs.unlink(req.file.path, () => undefined);
      return res.status(403).json({ message: "Nie masz dostępu do tej grupy." });
    }

    await reserveOcrCall(userId);

    const imageBuffer = fs.readFileSync(req.file.path);
    const rawOcrText = await extractTextFromImage(imageBuffer);
    const parsed = parseReceiptText(rawOcrText);

    const receipt = await prisma.receipt.create({
      data: {
        groupId,
        uploadedById: userId,
        title,
        storeName: parsed.storeName,
        total: parsed.total,
        imagePath: req.file.filename,
        rawOcrText,
        items: {
          create: parsed.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            assignees: {
              create: { userId }
            }
          }))
        }
      },
      include: receiptDetailInclude
    });

    return res.status(201).json({
      message: "Paragon zeskanowany.",
      receipt
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => undefined);
    }
    if (error instanceof OcrQuotaError) {
      return res.status(429).json({ message: error.message });
    }
    console.error("scanReceipt error", error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : "Błąd skanowania paragonu.";
    return res.status(500).json({ message });
  }
};

export const getReceipt = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const receipt = await getReceiptForUser(req.params.id, userId);

    if (!receipt) {
      return res.status(404).json({ message: "Paragon nie istnieje." });
    }

    return res.status(200).json({ receipt });
  } catch (error) {
    console.error("getReceipt error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const listGroupReceipts = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const groupId = req.params.groupId;

    const member = await isGroupMember(groupId, userId);
    if (!member) {
      return res.status(403).json({ message: "Nie masz dostępu do tej grupy." });
    }

    const receipts = await prisma.receipt.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, username: true } },
        _count: { select: { items: true } }
      }
    });

    return res.status(200).json({ receipts });
  } catch (error) {
    console.error("listGroupReceipts error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const deleteReceipt = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const receipt = await getReceiptForUser(req.params.id, userId);

    if (!receipt) {
      return res.status(404).json({ message: "Paragon nie istnieje." });
    }

    deleteReceiptImage(receipt.imagePath);
    await prisma.receipt.delete({ where: { id: receipt.id } });

    return res.status(200).json({ message: "Paragon usunięty." });
  } catch (error) {
    console.error("deleteReceipt error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const updateReceipt = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const receipt = await getReceiptForUser(req.params.id, userId);

    if (!receipt) {
      return res.status(404).json({ message: "Paragon nie istnieje." });
    }

    const title = (req.body.title as string | undefined)?.trim();

    if (title !== undefined && title.length === 0) {
      return res.status(400).json({ message: "Nazwa paragonu nie może być pusta." });
    }

    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: title !== undefined ? { title } : {},
      include: receiptDetailInclude
    });

    return res.status(200).json({ message: "Paragon zaktualizowany.", receipt: updated });
  } catch (error) {
    console.error("updateReceipt error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const updateReceiptItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const receipt = await getReceiptForUser(req.params.id, userId);

    if (!receipt) {
      return res.status(404).json({ message: "Paragon nie istnieje." });
    }

    const item = receipt.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Pozycja nie istnieje." });
    }

    const name = (req.body.name as string | undefined)?.trim();
    const totalPriceRaw = req.body.totalPrice;

    if (name !== undefined && name.length < 1) {
      return res.status(400).json({ message: "Nazwa pozycji jest wymagana." });
    }

    let totalPrice: number | undefined;
    if (totalPriceRaw !== undefined) {
      totalPrice = Number(totalPriceRaw);
      if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
        return res.status(400).json({ message: "Nieprawidłowa cena." });
      }
    }

    const quantity = Number(item.quantity);
    const nextTotal = totalPrice ?? Number(item.totalPrice);
    const nextUnitPrice = Number((nextTotal / quantity).toFixed(2));

    await prisma.receiptItem.update({
      where: { id: item.id },
      data: {
        name: name ?? item.name,
        totalPrice: nextTotal,
        unitPrice: nextUnitPrice
      }
    });

    const updated = await recalculateReceiptTotal(receipt.id);

    return res.status(200).json({ message: "Pozycja zaktualizowana.", receipt: updated });
  } catch (error) {
    console.error("updateReceiptItem error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const createReceiptItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const receipt = await getReceiptForUser(req.params.id, userId);

    if (!receipt) {
      return res.status(404).json({ message: "Paragon nie istnieje." });
    }

    const name = (req.body.name as string | undefined)?.trim();
    const totalPrice = Number(req.body.totalPrice);
    const quantityRaw = req.body.quantity;
    const quantity = quantityRaw !== undefined ? Number(quantityRaw) : 1;

    if (!name) {
      return res.status(400).json({ message: "Nazwa pozycji jest wymagana." });
    }

    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      return res.status(400).json({ message: "Nieprawidłowa cena." });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Nieprawidłowa ilość." });
    }

    const unitPrice = Number((totalPrice / quantity).toFixed(2));

    await prisma.receiptItem.create({
      data: {
        receiptId: receipt.id,
        name,
        quantity,
        unitPrice,
        totalPrice,
        assignees: {
          create: { userId }
        }
      }
    });

    const updated = await recalculateReceiptTotal(receipt.id);

    return res.status(201).json({ message: "Pozycja dodana.", receipt: updated });
  } catch (error) {
    console.error("createReceiptItem error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const assignReceiptItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const receipt = await getReceiptForUser(req.params.id, userId);

    if (!receipt) {
      return res.status(404).json({ message: "Paragon nie istnieje." });
    }

    const item = receipt.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Pozycja nie istnieje." });
    }

    const { userId: assignUserId } = req.body as { userId?: string };

    if (typeof assignUserId !== "string" || assignUserId.length === 0) {
      return res.status(400).json({ message: "Nieprawidłowy użytkownik." });
    }

    const member = await isGroupMember(receipt.groupId, assignUserId);
    if (!member) {
      return res.status(400).json({ message: "Ta osoba nie należy do grupy." });
    }

    const existing = await prisma.receiptItemAssignee.findUnique({
      where: { itemId_userId: { itemId: item.id, userId: assignUserId } }
    });

    if (existing) {
      await prisma.receiptItemAssignee.delete({ where: { id: existing.id } });
    } else {
      await prisma.receiptItemAssignee.create({
        data: { itemId: item.id, userId: assignUserId }
      });
    }

    const updated = await recalculateReceiptTotal(receipt.id);

    return res.status(200).json({ message: "Przypisanie zapisane.", receipt: updated });
  } catch (error) {
    console.error("assignReceiptItem error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};
