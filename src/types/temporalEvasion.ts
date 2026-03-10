// src/types/temporalEvasion.ts
// ─────────────────────────────────────────────────────────────────────────────
// Matches backend  POST /temporal-evasion/predict  exactly

export interface TemporalEvasionRequest {
  subject:     string;
  body:        string;
  sent_at:     string;   // ISO-8601, e.g. "2025-03-10T03:14:00"
  burst_count: number;   // emails from same sender in last hour
}

export interface TemporalFeatures {
  hour:                number;  // 0-23
  hour_sin:            number;
  hour_cos:            number;
  is_suspicious_time:  number;  // 0 or 1
  is_burst:            number;  // 0 or 1
  time_drift:          number;  // seconds from 9 AM baseline
  day_of_week:         number;  // 0=Mon … 6=Sun
  is_weekend:          number;  // 0 or 1
  arrival_epoch:       number;
  burst_count:         number;
  is_anomaly:          number;  // 0 or 1
}

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface TemporalEvasionResponse {
  is_threat:         boolean;
  confidence:        number;          // 0 – 100 %
  risk_level:        RiskLevel;
  threat_type:       string;
  model_used:        string;
  temporal_features: TemporalFeatures;
  indicators:        string[];
}
