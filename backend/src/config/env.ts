const JWT_EXPIRES_IN = "7d";

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const env = {
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret",
  jwtExpiresIn: JWT_EXPIRES_IN,
  googleVisionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY || "",
  ocrMaxTotal: parsePositiveInt(process.env.OCR_MAX_TOTAL, 500),
  ocrMaxPerWindow: parsePositiveInt(process.env.OCR_MAX_PER_WINDOW, 10),
  ocrWindowMinutes: parsePositiveInt(process.env.OCR_WINDOW_MINUTES, 10)
};
