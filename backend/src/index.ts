import dotenv from "dotenv";
import app from "./app";
import { prisma } from "./config/prisma";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const assertPrismaModels = () => {
  if (!("ocrApiCall" in prisma) || !prisma.ocrApiCall) {
    console.error(
      "\n[ParagonSplit] Brak modelu OcrApiCall w Prisma Client.\n" +
        "Zatrzymaj backend, uruchom: npm run prisma:generate\n" +
        "Następnie uruchom backend ponownie: npm run dev\n"
    );
    process.exit(1);
  }
};

assertPrismaModels();

const server = app.listen(PORT, () => {
  console.log(`ParagonSplit backend listening on port ${PORT}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `\n[ParagonSplit] Port ${PORT} jest już zajęty.\n` +
        "Zatrzymaj poprzedni backend (Ctrl+C) lub zamknij drugi proces na porcie 4000.\n"
    );
    process.exit(1);
  }
  throw error;
});
