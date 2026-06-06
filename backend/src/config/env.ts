const JWT_EXPIRES_IN = "7d";
const DEV_JWT_SECRET = "dev-only-jwt-secret-not-for-production";

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const isProduction = process.env.NODE_ENV === "production";

const parseCorsOrigins = (): string[] => {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  jwtSecret: process.env.JWT_SECRET || (isProduction ? "" : DEV_JWT_SECRET),
  jwtExpiresIn: JWT_EXPIRES_IN,
  googleVisionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY || "",
  corsOrigins: parseCorsOrigins(),
  ocrMaxTotal: parsePositiveInt(process.env.OCR_MAX_TOTAL, 500),
  ocrMaxPerWindow: parsePositiveInt(process.env.OCR_MAX_PER_WINDOW, 10),
  ocrWindowMinutes: parsePositiveInt(process.env.OCR_WINDOW_MINUTES, 10)
};

export const validateEnv = (): void => {
  if (env.isProduction) {
    if (!env.jwtSecret || env.jwtSecret.length < 32) {
      console.error(
        "\n[ParagonSplit] NODE_ENV=production wymaga JWT_SECRET (min. 32 znaki) w zmiennych środowiska.\n"
      );
      process.exit(1);
    }

    if (env.jwtSecret === DEV_JWT_SECRET) {
      console.error("\n[ParagonSplit] JWT_SECRET nie może być wartością deweloperską na produkcji.\n");
      process.exit(1);
    }

    if (!env.googleVisionApiKey) {
      console.warn(
        "[ParagonSplit] Brak GOOGLE_CLOUD_VISION_API_KEY — skanowanie paragonów będzie niedostępne."
      );
    }
  }
};
