const normalizeApiBaseUrl = (rawUrl: string | undefined): string => {
  const fallback = "http://localhost:4000";
  if (!rawUrl) return fallback;
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return fallback;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

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
