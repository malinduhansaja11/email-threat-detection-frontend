// src/services/headerSpoofingService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Calls  POST /header-spoofing/predict  on the FastAPI backend

import type {
  HeaderSpoofingRequest,
  HeaderSpoofingResponse,
} from "../types/headerSpoofing";

const API_BASE = "http://localhost:8000";

export async function analyzeHeaderSpoofing(
  req: HeaderSpoofingRequest
): Promise<HeaderSpoofingResponse> {
  const res = await fetch(`${API_BASE}/header-spoofing/predict`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(req),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Header-Spoofing API error ${res.status}: ${txt}`);
  }

  return res.json() as Promise<HeaderSpoofingResponse>;
}

export async function getHeaderModelStatus(): Promise<{
  model_loaded: boolean;
  model_exists: boolean;
  error:        string | null;
}> {
  const res = await fetch(`${API_BASE}/header-spoofing/status`);
  return res.json();
}
