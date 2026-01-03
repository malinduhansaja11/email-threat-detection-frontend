import type { AnalyzeResponse } from "../types/analyzer";

const API_BASE = "http://localhost:8000";

export async function analyzeEmailBody(body: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error: ${txt}`);
  }

  return res.json();
}
