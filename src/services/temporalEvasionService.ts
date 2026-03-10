// src/services/temporalEvasionService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Calls  POST /temporal-evasion/predict  on the FastAPI backend

import type {
  TemporalEvasionRequest,
  TemporalEvasionResponse,
} from "../types/temporalEvasion";

const API_BASE = "http://localhost:8000";

export async function analyzeTemporalEvasion(
  req: TemporalEvasionRequest
): Promise<TemporalEvasionResponse> {
  const res = await fetch(`${API_BASE}/temporal-evasion/predict`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(req),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Temporal-Evasion API error ${res.status}: ${txt}`);
  }

  return res.json() as Promise<TemporalEvasionResponse>;
}

export async function getTemporalModelStatus(): Promise<{
  model_loaded: boolean;
  model_exists: boolean;
  error:        string | null;
  metadata:     Record<string, unknown>;
}> {
  const res = await fetch(`${API_BASE}/temporal-evasion/status`);
  return res.json();
}
