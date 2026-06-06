import cors from "cors";
import express from "express";
import path from "path";
import authRouter from "./routes/authRoutes";
import groupRouter from "./routes/groupRoutes";
import receiptRouter from "./routes/receiptRoutes";
import { uploadsDirectory } from "./config/upload";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(uploadsDirectory)));
app.use("/api/auth", authRouter);
app.use("/api/groups", groupRouter);
app.use("/api/receipts", receiptRouter);

export default app;
