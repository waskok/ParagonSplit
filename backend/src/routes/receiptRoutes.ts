import { Router } from "express";
import {
  assignReceiptItem,
  createReceiptItem,
  deleteReceipt,
  getReceipt,
  getReceiptImage,
  listGroupReceipts,
  scanReceipt,
  updateReceipt,
  updateReceiptItem
} from "../controllers/receiptController";
import { uploadReceiptImage } from "../config/upload";
import { authenticate } from "../middlewares/authMiddleware";
import { scanRateLimiter } from "../middlewares/rateLimitMiddleware";

const receiptRouter = Router();

receiptRouter.use(authenticate);
receiptRouter.post("/scan", scanRateLimiter, uploadReceiptImage.single("image"), scanReceipt);
receiptRouter.get("/group/:groupId", listGroupReceipts);
receiptRouter.get("/:id/image", getReceiptImage);
receiptRouter.get("/:id", getReceipt);
receiptRouter.patch("/:id", updateReceipt);
receiptRouter.delete("/:id", deleteReceipt);
receiptRouter.post("/:id/items", createReceiptItem);
receiptRouter.patch("/:id/items/:itemId/assign", assignReceiptItem);
receiptRouter.patch("/:id/items/:itemId", updateReceiptItem);

export default receiptRouter;
