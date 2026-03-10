// src/types/headerSpoofing.ts
// ─────────────────────────────────────────────────────────────────────────────
// Types that match backend  /header-spoofing/predict  exactly

export interface HeaderSpoofingRequest {
  email_from:     string;
  subject:        string;
  body:           string;
  reply_to:       string;
  dkim:           boolean;
  spf:            boolean;
  has_attachment: boolean;
}

export interface FeatureScores {
  sender:      number; // 0-1  higher = safer
  link:        number;
  language:    number;
  header_auth: number;
  server:      number;
  login:       number;
  path:        number;
  attachment:  number;
}

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface HeaderSpoofingResponse {
  is_threat:   boolean;
  confidence:  number;       // 0–100 %
  risk_level:  RiskLevel;
  threat_type: string;
  model_used:  string;
  details:     string[];
  scores:      FeatureScores;
}
