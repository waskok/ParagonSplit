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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data?.message === "string") {
      return data.message;
    }
  } catch {
    // Ignore JSON parse errors and return fallback message.
  }
  return "Unexpected API error.";
};

export const registerRequest = async (payload: RegisterPayload): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};

export const loginRequest = async (
  payload: LoginPayload
): Promise<{ token: string; user: AuthUser }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as { token: string; user: AuthUser };
  return data;
};
