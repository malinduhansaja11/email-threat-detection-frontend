// src/services/inboxScanService.ts
const API_BASE = "http://localhost:8000";

export interface ModelScore {
  name:        string;
  score:       number;
  description: string;
}

export interface ThreatResult {
  verdict:          "SPAM" | "HAM" | "UNKNOWN" | "ERROR";
  spam_probability: number;
  risk_level:       "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";
  risk_color:       string;
  model_scores:     ModelScore[];
  temporal_flags:   string[];
  scan_summary:     string;
  model_version:    string;
  scanned:          boolean;
}

export interface ScannedEmail {
  id:          string;
  sender:      string;
  subject:     string;
  body:        string;
  received_at: string;
  threat:      ThreatResult;
}

export interface ScanResult {
  connected:  boolean;
  source:     "gmail" | "demo";
  total:      number;
  spam_count: number;
  ham_count:  number;
  high_risk:  number;
  emails:     ScannedEmail[];
}

export async function fetchScannedInbox(): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/emails/scan`);
  if (!res.ok) throw new Error(`Scan API error ${res.status}: ${await res.text()}`);
  return res.json();
}
