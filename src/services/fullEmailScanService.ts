const API_BASE = "http://localhost:8000";

export type FullScanVerdict =
  | "SAFE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "UNKNOWN"
  | string;

export interface FullScanFinalResult {
  verdict: FullScanVerdict;
  is_threat: boolean;
  risk_score: number;
  reasons: string[];
  failed_modules?: string[];
}

export interface FullScanModuleEnvelope {
  ok?: boolean;
  result?: unknown;
  error?: string | null;
}

export interface FullScanModuleSummary {
  obfuscation?: {
    ok?: boolean;
    risk_score?: number;
    detected_tokens?: string[];
    error?: string | null;
  };
  temporal_evasion?: {
    ok?: boolean;
    is_threat?: boolean;
    risk_level?: string;
    confidence?: number;
    model_used?: string;
    error?: string | null;
  };
  header_spoofing?: {
    ok?: boolean;
    is_threat?: boolean;
    risk_level?: string;
    confidence?: number;
    model_used?: string;
    error?: string | null;
  };
  url_threat?: {
    ok?: boolean;
    verdict?: string;
    total_urls?: number;
    max_score?: number;
    blocked_urls?: number;
    quarantine_urls?: number;
    warned_urls?: number;
    error?: string | null;
  };
}

export interface FullEmailScanResponse {
  email_id?: string;
  sender?: string;
  subject?: string;
  sent_at?: string;
  final_result: FullScanFinalResult;
  module_summary: FullScanModuleSummary;
  modules?: Record<string, FullScanModuleEnvelope>;
}

export type FullScanEmailInput = {
  id?: string;
  message_id?: string;
  sender?: string;
  subject?: string;
  body?: string;
  body_preview?: string;
  date?: string;
  received_at?: string;
  reply_to?: string;
  return_path?: string;
  spf?: string;
  dkim?: string;
  dmarc?: string;
  sender_domain?: string;
  headers?: Record<string, unknown>;
  received?: unknown[];
  attachments?: unknown[];
  has_attachment?: boolean;
};

function getHeaderValue(
  headers: Record<string, unknown> | undefined,
  key: string
): string {
  if (!headers) return "";

  const foundKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  );

  const value = foundKey ? headers[foundKey] : "";

  return typeof value === "string" ? value : value ? String(value) : "";
}

export async function scanSingleEmail(
  email: FullScanEmailInput
): Promise<FullEmailScanResponse> {
  const headers = email.headers || {};
  const attachments = email.attachments || [];

  const payload = {
    id: email.id,
    message_id: email.message_id || email.id,

    sender: email.sender || "",
    subject: email.subject || "",
    body: email.body || "",
    body_preview: email.body_preview || "",

    date: email.date || email.received_at || "",
    sent_at: email.date || email.received_at || "",
    email_date: email.date || email.received_at || "",

    reply_to:
      email.reply_to ||
      getHeaderValue(headers, "reply-to") ||
      getHeaderValue(headers, "Reply-To"),

    return_path:
      email.return_path ||
      getHeaderValue(headers, "return-path") ||
      getHeaderValue(headers, "Return-Path"),

    spf: email.spf || getHeaderValue(headers, "spf") || "unknown",
    dkim: email.dkim || getHeaderValue(headers, "dkim") || "unknown",
    dmarc: email.dmarc || getHeaderValue(headers, "dmarc") || "unknown",

    sender_domain: email.sender_domain || "",
    headers,
    received: email.received || [],
    attachments,
    has_attachment: email.has_attachment || attachments.length > 0,

    burst_count: 1,
  };

  const res = await fetch(`${API_BASE}/scan/single-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Full scan failed ${res.status}: ${await res.text()}`);
  }

  return res.json();
}