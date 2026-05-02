import { getFirebaseToken } from "./authService";

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:8000";

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiFetch(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const token = await getFirebaseToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;

    try {
      const data = await res.json();
      message = data.detail || data.message || message;
    } catch {
      try {
        message = await res.text();
      } catch {
        // keep default message
      }
    }

    throw new Error(message);
  }

  return res;
}

export async function apiJson<T>(path: string, options: ApiOptions = {}) {
  const res = await apiFetch(path, options);
  return res.json() as Promise<T>;
}