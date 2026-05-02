import { apiFetch, apiJson } from "./apiClient";

export async function checkAuthStatus(): Promise<boolean> {
  try {
    const data = await apiJson<{ connected: boolean }>("/auth/status");
    return data.connected === true;
  } catch {
    return false;
  }
}

export async function connectGmail(): Promise<void> {
  const data = await apiJson<{ url: string }>("/auth/google/start", {
    method: "POST",
  });

  if (!data.url) {
    throw new Error("Backend did not return Gmail OAuth URL");
  }

  window.location.href = data.url;
}

export async function disconnectGmail(): Promise<void> {
  await apiFetch("/auth/logout", {
    method: "POST",
  });
}