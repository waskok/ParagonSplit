export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
};

import { API_BASE_URL, parseApiError } from "./apiClient";

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
    throw new Error(await parseApiError(response));
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
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { token: string; user: AuthUser };
  return data;
};
