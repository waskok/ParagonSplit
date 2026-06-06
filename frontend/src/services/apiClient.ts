/** Pusty string = API przez proxy Vite (/api, /uploads) — tryb ngrok / dev:phone */
const normalizeApiBaseUrl = (rawUrl: string | undefined): string => {
  if (rawUrl === undefined || rawUrl.trim() === "") return "";
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (trimmed === "proxy") return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const usesApiProxy = API_BASE_URL === "";

export const getAuthHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
});

export const parseApiError = async (response: Response): Promise<string> => {
  const statusPrefix = `Błąd API (${response.status})`;
  try {
    const data = await response.json();
    if (typeof data?.message === "string") return data.message;
  } catch {
    // ignore
  }
  return statusPrefix;
};
