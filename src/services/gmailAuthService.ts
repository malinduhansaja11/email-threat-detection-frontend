const API_BASE = "http://localhost:8000";

export function connectGmail() {
  window.location.href = `${API_BASE}/auth/google/login`;
}

export async function checkAuthStatus(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/status`, {
    credentials: "include",
  });
  const data = await res.json();
  return data.connected === true;
}

/**
 * ✅ Disconnect Gmail session
 * IMPORTANT:
 * Backend එකේ logout/disconnect endpoint එක project එකට අනුව වෙනස් වෙන්න පුළුවන්.
 * මේක common endpoints කිහිපයක් try කරනවා.
 */
export async function disconnectGmail(): Promise<void> {
  const candidates = [
    `${API_BASE}/auth/logout`,
    `${API_BASE}/auth/google/logout`,
    `${API_BASE}/auth/disconnect`,
  ];

  // Try endpoints until one succeeds (2xx)
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) return;
    } catch {
      // ignore and try next
    }
  }

  // If none exists, we still "locally" disconnect in UI,
  // but backend might stay connected until you add a real logout route.
}
