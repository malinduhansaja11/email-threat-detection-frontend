// src/services/temporalEvasionService.ts
//
// Calls POST /temporal-evasion/predict  (your actual backend endpoint)
// and adapts the response into the shape TemporalEvasionPanel expects.

import type {
  TemporalResult,
  BatchSummary,
  RiskLevel,
  _BackendResponse,
} from "../types/temporalEvasion";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ── Request types (what we send to the backend) ───────────────────────────────

export interface SingleAnalyzeRequest {
  subject: string;
  body: string;
  date: string;      // mapped → sent_at
  sender: string;
  burst_count?: number;
}

export interface BatchAnalyzeRequest {
  emails: Array<{
    id: string;
    subject: string;
    body: string;
    date: string;
    sender: string;
  }>;
}

// ── Adapt backend risk_level ("safe"/"low"/…) → panel RiskLevel (uppercase) ──

function toRiskLevel(raw: string): RiskLevel {
  const map: Record<string, RiskLevel> = {
    safe:     "LOW",
    low:      "LOW",
    medium:   "MEDIUM",
    high:     "HIGH",
    critical: "CRITICAL",
  };
  return map[raw?.toLowerCase()] ?? "LOW";
}

// ── Adapt a single backend response → TemporalResult ─────────────────────────

function adaptResponse(raw: _BackendResponse, id = ""): TemporalResult {
  return {
    id,
    prediction: raw.is_threat ? "spam" : "ham",
    confidence: raw.confidence,                      // already 0–100
    risk_level: toRiskLevel(raw.risk_level),
    flags: raw.indicators ?? [],
    temporal: raw.temporal_features,
  };
}

// ── Single email analysis ─────────────────────────────────────────────────────

export async function analyzeTemporalSingle(
  req: SingleAnalyzeRequest
): Promise<TemporalResult> {
  const res = await fetch(`${API_BASE}/temporal-evasion/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject:     req.subject,
      body:        req.body,
      sent_at:     req.date,        // backend expects "sent_at"
      burst_count: req.burst_count ?? 1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  const raw: _BackendResponse = await res.json();
  return adaptResponse(raw);
}

// ── Batch / burst inbox scan ──────────────────────────────────────────────────
// The backend only has a single-predict endpoint, so we fan out in parallel
// and compute burst_count per sender here on the client side.

export async function analyzeTemporalBatch(
  req: BatchAnalyzeRequest
): Promise<BatchSummary> {
  const { emails } = req;

  // Count emails per sender so we can pass burst_count to each request
  const senderCounts: Record<string, number> = {};
  for (const e of emails) {
    const key = (e.sender ?? "").toLowerCase();
    senderCounts[key] = (senderCounts[key] ?? 0) + 1;
  }

  // Fire all requests in parallel
  const results: TemporalResult[] = await Promise.all(
    emails.map((e) =>
      analyzeTemporalSingle({
        subject:     e.subject,
        body:        e.body,
        date:        e.date,
        sender:      e.sender,
        burst_count: senderCounts[(e.sender ?? "").toLowerCase()] ?? 1,
      }).then((r) => ({ ...r, id: e.id }))
    )
  );

  // Build summary stats
  const spam     = results.filter((r) => r.prediction === "spam").length;
  const critical = results.filter((r) => r.risk_level === "CRITICAL").length;
  const high     = results.filter((r) => r.risk_level === "HIGH").length;
  const medium   = results.filter((r) => r.risk_level === "MEDIUM").length;
  const low      = results.filter((r) => r.risk_level === "LOW").length;
  const burst_detected = results.some((r) => r.temporal?.is_burst === 1);

  return {
    total: results.length,
    spam,
    ham: results.length - spam,
    critical,
    high,
    medium,
    low,
    burst_detected,
    results,
  };
}
