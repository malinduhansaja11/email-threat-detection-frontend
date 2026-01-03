const API_BASE = "http://localhost:8000";

export function connectGmail() {
  window.location.href = `${API_BASE}/auth/google/login`;
}

export async function checkAuthStatus(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/status`);
  const data = await res.json();
  return data.connected === true;
}
