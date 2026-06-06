import { Router } from "express";
import {
  createReceiptItem,
  deleteReceipt,
  getReceipt,
  listGroupReceipts,
  scanReceipt,
  updateReceipt,
  updateReceiptItem
} from "../controllers/receiptController";
import { uploadReceiptImage } from "../config/upload";
import { authenticate } from "../middlewares/authMiddleware";

const receiptRouter = Router();

receiptRouter.use(authenticate);
receiptRouter.post("/scan", uploadReceiptImage.single("image"), scanReceipt);
receiptRouter.get("/group/:groupId", listGroupReceipts);
receiptRouter.get("/:id", getReceipt);
receiptRouter.patch("/:id", updateReceipt);
receiptRouter.delete("/:id", deleteReceipt);
receiptRouter.post("/:id/items", createReceiptItem);
receiptRouter.patch("/:id/items/:itemId", updateReceiptItem);

export default receiptRouter;
