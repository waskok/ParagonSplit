import { prisma } from "../config/prisma";
import { env } from "../config/env";

export class OcrQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OcrQuotaError";
  }
}

export type OcrQuotaStatus = {
  totalUsed: number;
  totalLimit: number;
  recentUsed: number;
  recentLimit: number;
  windowMinutes: number;
};

export const getOcrQuotaStatus = async (): Promise<OcrQuotaStatus> => {
  const windowStart = new Date(Date.now() - env.ocrWindowMinutes * 60 * 1000);
  const [totalUsed, recentUsed] = await Promise.all([
    prisma.ocrApiCall.count(),
    prisma.ocrApiCall.count({ where: { createdAt: { gte: windowStart } } })
  ]);

  return {
    totalUsed,
    totalLimit: env.ocrMaxTotal,
    recentUsed,
    recentLimit: env.ocrMaxPerWindow,
    windowMinutes: env.ocrWindowMinutes
  };
};

export const reserveOcrCall = async (userId: string): Promise<void> => {
  const windowStart = new Date(Date.now() - env.ocrWindowMinutes * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const totalUsed = await tx.ocrApiCall.count();
    if (totalUsed >= env.ocrMaxTotal) {
      throw new OcrQuotaError(
        `Limit OCR wyczerpany (${env.ocrMaxTotal} zapytań). Skontaktuj się z administratorem.`
      );
    }

    const recentUsed = await tx.ocrApiCall.count({
      where: { createdAt: { gte: windowStart } }
    });
    if (recentUsed >= env.ocrMaxPerWindow) {
      throw new OcrQuotaError(
        `Limit OCR: maksymalnie ${env.ocrMaxPerWindow} skanów na ${env.ocrWindowMinutes} minut. Spróbuj później.`
      );
    }

    await tx.ocrApiCall.create({ data: { userId } });
  });
};
