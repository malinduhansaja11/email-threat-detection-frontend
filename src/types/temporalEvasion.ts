// src/types/temporalEvasion.ts
// Matches the actual backend response from POST /temporal-evasion/predict

export interface TemporalFeatures {
  hour: number;
  hour_sin: number;
  hour_cos: number;
  is_suspicious_time: number;
  is_burst: number;
  time_drift: number;
  day_of_week: number;
  is_weekend: number;
  arrival_epoch: number;
  burst_count: number;
  is_anomaly: number;
}

// RiskLevel is uppercase to match what the panel uses
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// TemporalResult — the shape the panel components consume
export interface TemporalResult {
  id: string;
  prediction: "spam" | "ham";
  confidence: number;        // 0–100
  risk_level: RiskLevel;
  flags: string[];
  temporal: TemporalFeatures;
}

// BatchSummary — returned by analyzeTemporalBatch
export interface BatchSummary {
  total: number;
  spam: number;
  ham: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  burst_detected: boolean;
  results: TemporalResult[];
}

// ── Raw backend response shape (from /temporal-evasion/predict) ──────────────
// The panel never sees this directly — the service adapts it into TemporalResult.
export interface _BackendResponse {
  is_threat: boolean;
  confidence: number;           // 0–100
  risk_level: string;           // "safe" | "low" | "medium" | "high" | "critical"
  threat_type: string;
  model_used: string;
  temporal_features: TemporalFeatures;
  indicators: string[];
}
