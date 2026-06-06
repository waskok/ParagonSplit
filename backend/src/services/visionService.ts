import { env } from "../config/env";

type VisionResponse = {
  responses?: Array<{
    fullTextAnnotation?: { text?: string };
    error?: { message?: string };
  }>;
};

export const extractTextFromImage = async (imageBuffer: Buffer): Promise<string> => {
  if (!env.googleVisionApiKey) {
    throw new Error("OCR niedostępne: brak klucza GOOGLE_CLOUD_VISION_API_KEY na serwerze.");
  }

  const base64 = imageBuffer.toString("base64");
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${env.googleVisionApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "TEXT_DETECTION" }],
            imageContext: { languageHints: ["pl", "en"] }
          }
        ]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Google Vision API error (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as VisionResponse;
  const first = data.responses?.[0];

  if (first?.error?.message) {
    throw new Error("Google Vision nie przetworzyło obrazu.");
  }

  const text = first?.fullTextAnnotation?.text?.trim();
  if (!text) {
    throw new Error("Nie udało się odczytać tekstu z paragonu.");
  }

  return text;
};
