export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

const normalizeApiBaseUrl = (rawUrl: string | undefined): string => {
  const fallback = "http://localhost:4000";
  if (!rawUrl) {
    return fallback;
  }

  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return fallback;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const parseErrorMessage = async (response: Response): Promise<string> => {
  const statusPrefix = `API error (${response.status})`;

  try {
    const data = await response.json();
    if (typeof data?.message === "string") {
      return data.message;
    }
  } catch {
    try {
      const text = await response.text();
      if (text.trim()) {
        return `${statusPrefix}: ${text.slice(0, 120)}`;
      }
    } catch {
      // Ignore text parse errors and use fallback message.
    }
  }
  return statusPrefix;
};

export const registerRequest = async (payload: RegisterPayload): Promise<void> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error(
      `Nie można połączyć się z API (${API_BASE_URL}). Sprawdź adres VITE_API_URL i czy backend działa.`
    );
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};

export const loginRequest = async (
  payload: LoginPayload
): Promise<{ token: string; user: AuthUser }> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error(
      `Nie można połączyć się z API (${API_BASE_URL}). Sprawdź adres VITE_API_URL i czy backend działa.`
    );
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as { token: string; user: AuthUser };
  return data;
};
