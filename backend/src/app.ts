import cors from "cors";
import express from "express";
import authRouter from "./routes/authRoutes";
import groupRouter from "./routes/groupRoutes";
import receiptRouter from "./routes/receiptRoutes";
import { env } from "./config/env";

const app = express();

const corsOptions: cors.CorsOptions = env.isProduction
  ? {
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    }
  : {
      origin: true,
      credentials: true
    };

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", authRouter);
app.use("/api/groups", groupRouter);
app.use("/api/receipts", receiptRouter);

export default app;
