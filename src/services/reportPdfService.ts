import jsPDF from "jspdf";
import type { FullEmailScanResponse } from "./fullEmailScanService";

type EmailForReport = {
  id?: string;
  sender?: string;
  subject?: string;
  body?: string;
  date?: string;
  received_at?: string;
  sender_domain?: string;
  spf?: string;
  dkim?: string;
  dmarc?: string;
  reply_to?: string;
  attachments?: unknown[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripHtml(value: string): string {
  if (!value) return "";

  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getModuleResult(
  result: FullEmailScanResponse,
  moduleName: string
): UnknownRecord {
  const moduleData = result.modules?.[moduleName];

  if (!moduleData || !isRecord(moduleData.result)) return {};

  return moduleData.result;
}

function toText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;

  if (Array.isArray(value)) {
    const text = value.length ? value.map((x) => stripHtml(String(x))).join(", ") : fallback;
    return stripHtml(text);
  }

  if (typeof value === "object") {
    return stripHtml(JSON.stringify(value));
  }

  return stripHtml(String(value));
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((x) => stripHtml(String(x))).filter(Boolean);
  }

  if (typeof value === "string") {
    return [stripHtml(value)];
  }

  return [];
}

function fileSafe(value: string): string {
  return stripHtml(value)
    .replace(/[^a-z0-9_\-]+/gi, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 6
): number {
  const cleanText = stripHtml(text || "—");
  const lines = doc.splitTextToSize(cleanText || "—", maxWidth);

  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }

    doc.text(line, x, y);
    y += lineHeight;
  }

  return y;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(26, 58, 92);
  doc.rect(14, y - 5, 182, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(stripHtml(title), 17, y + 1);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  return y + 13;
}

function addLabelValue(
  doc: jsPDF,
  label: string,
  value: unknown,
  y: number
): number {
  if (y > 275) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`${stripHtml(label)}:`, 16, y);

  doc.setFont("helvetica", "normal");
  y = addWrappedText(doc, toText(value), 58, y, 135, 5);

  return y + 1;
}

function addBulletList(
  doc: jsPDF,
  title: string,
  values: string[],
  y: number
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(stripHtml(title), 16, y);
  y += 6;

  doc.setFont("helvetica", "normal");

  if (!values.length) {
    return addWrappedText(doc, "• No details returned.", 20, y, 170, 5) + 2;
  }

  for (const value of values) {
    y = addWrappedText(doc, `• ${stripHtml(value)}`, 20, y, 170, 5) + 1;
  }

  return y + 2;
}

export function generateSingleEmailThreatReportPdf(
  email: EmailForReport,
  result: FullEmailScanResponse
) {
  const doc = new jsPDF("p", "mm", "a4");

  const finalResult = result.final_result;
  const summary = result.module_summary;

  const obfuscation = getModuleResult(result, "obfuscation");
  const temporal = getModuleResult(result, "temporal_evasion");
  const header = getModuleResult(result, "header_spoofing");
  const url = getModuleResult(result, "url_threat");

  const obfuscationTokens = [
    ...toStringArray(obfuscation.obf_tokens),
    ...toStringArray(obfuscation.obfuscated_tokens),
    ...toStringArray(obfuscation.suspicious_tokens),
    ...(summary.obfuscation?.detected_tokens || []),
  ].map(stripHtml);

  const temporalFlags = [
    ...toStringArray(temporal.temporal_flags),
    ...toStringArray(temporal.indicators),
    ...toStringArray(temporal.flags),
    ...toStringArray(temporal.reasons),
  ].map(stripHtml);

  const headerDetails = [
    ...toStringArray(header.details),
    ...toStringArray(header.indicators),
    ...toStringArray(header.reasons),
    ...toStringArray(header.flags),
  ].map(stripHtml);

  const urlResults = Array.isArray(url.results)
    ? url.results.filter(isRecord)
    : [];

  let y = 18;

  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Email Threat Analysis Report", 14, 14);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

  doc.setTextColor(0, 0, 0);
  y = 40;

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y - 5, 182, 36, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Overall Summary", 18, y + 2);

  doc.setFontSize(10);
  doc.text("Final Verdict:", 18, y + 12);
  doc.text("Risk Score:", 18, y + 20);
  doc.text("Threat:", 110, y + 12);
  doc.text("Email ID:", 110, y + 20);

  doc.setFont("helvetica", "normal");
  doc.text(toText(finalResult.verdict), 48, y + 12);
  doc.text(`${toText(finalResult.risk_score)}%`, 48, y + 20);
  doc.text(finalResult.is_threat ? "Yes" : "No", 130, y + 12);
  doc.text(toText(email.id || result.email_id), 130, y + 20);

  y += 42;

  y = addSectionTitle(doc, "Email Information", y);
  y = addLabelValue(doc, "Sender", email.sender || result.sender, y);
  y = addLabelValue(doc, "Subject", email.subject || result.subject, y);
  y = addLabelValue(doc, "Date", email.date || email.received_at || result.sent_at, y);
  y = addLabelValue(doc, "Sender Domain", email.sender_domain, y);
  y = addLabelValue(doc, "Reply-To", email.reply_to, y);
  y = addLabelValue(doc, "Attachments", email.attachments?.length || 0, y);

  y = addSectionTitle(doc, "Final Reasons", y + 2);
  y = addBulletList(doc, "Main reasons:", finalResult.reasons || [], y);

  y = addSectionTitle(doc, "Module Summary", y + 2);
  y = addLabelValue(doc, "Obfuscation Risk", summary.obfuscation?.risk_score ?? "0", y);
  y = addLabelValue(doc, "Temporal Risk Level", summary.temporal_evasion?.risk_level || "UNKNOWN", y);
  y = addLabelValue(doc, "Temporal Confidence", summary.temporal_evasion?.confidence ?? "—", y);
  y = addLabelValue(doc, "Header Risk Level", summary.header_spoofing?.risk_level || "UNKNOWN", y);
  y = addLabelValue(doc, "Header Confidence", summary.header_spoofing?.confidence ?? "—", y);
  y = addLabelValue(doc, "URL Verdict", summary.url_threat?.verdict || "CLEAN", y);
  y = addLabelValue(doc, "Total URLs", summary.url_threat?.total_urls ?? 0, y);

  y = addSectionTitle(doc, "Obfuscation Analysis Details", y + 2);
  y = addLabelValue(doc, "Risk Score", obfuscation.risk_score ?? summary.obfuscation?.risk_score ?? 0, y);
  y = addLabelValue(doc, "Detected Token Count", obfuscationTokens.length, y);
  y = addBulletList(
    doc,
    "Detected obfuscated / suspicious words:",
    Array.from(new Set(obfuscationTokens)),
    y
  );

  y = addSectionTitle(doc, "Temporal Evasion Analysis Details", y + 2);
  y = addLabelValue(doc, "Threat Detected", temporal.is_threat ?? summary.temporal_evasion?.is_threat ?? false, y);
  y = addLabelValue(doc, "Risk Level", temporal.risk_level ?? summary.temporal_evasion?.risk_level ?? "UNKNOWN", y);
  y = addLabelValue(doc, "Confidence", temporal.confidence ?? summary.temporal_evasion?.confidence ?? "—", y);
  y = addLabelValue(doc, "Model Used", temporal.model_used ?? summary.temporal_evasion?.model_used ?? "—", y);
  y = addBulletList(doc, "Temporal indicators:", temporalFlags, y);

  y = addSectionTitle(doc, "Header Spoofing Analysis Details", y + 2);
  y = addLabelValue(doc, "Threat Detected", header.is_threat ?? summary.header_spoofing?.is_threat ?? false, y);
  y = addLabelValue(doc, "Risk Level", header.risk_level ?? summary.header_spoofing?.risk_level ?? "UNKNOWN", y);
  y = addLabelValue(doc, "Confidence", header.confidence ?? summary.header_spoofing?.confidence ?? "—", y);
  y = addLabelValue(doc, "Model Used", header.model_used ?? summary.header_spoofing?.model_used ?? "—", y);
  y = addLabelValue(doc, "SPF", header.spf ?? header.spf_status ?? email.spf ?? "—", y);
  y = addLabelValue(doc, "DKIM", header.dkim ?? header.dkim_status ?? email.dkim ?? "—", y);
  y = addLabelValue(doc, "DMARC", header.dmarc ?? header.dmarc_status ?? email.dmarc ?? "—", y);
  y = addBulletList(doc, "Header indicators:", headerDetails, y);

  y = addSectionTitle(doc, "URL Threat Analysis Details", y + 2);
  y = addLabelValue(doc, "URL Verdict", url.verdict ?? summary.url_threat?.verdict ?? "CLEAN", y);
  y = addLabelValue(doc, "Total URLs", url.total_urls ?? summary.url_threat?.total_urls ?? 0, y);
  y = addLabelValue(doc, "Maximum URL Score", url.max_score ?? summary.url_threat?.max_score ?? 0, y);
  y = addLabelValue(doc, "Blocked URLs", url.blocked_urls ?? summary.url_threat?.blocked_urls ?? 0, y);
  y = addLabelValue(doc, "Quarantined URLs", url.quarantine_urls ?? summary.url_threat?.quarantine_urls ?? 0, y);
  y = addLabelValue(doc, "Warned URLs", url.warned_urls ?? summary.url_threat?.warned_urls ?? 0, y);

  if (urlResults.length > 0) {
    y = addSectionTitle(doc, "Detailed URL Results", y + 2);

    urlResults.forEach((item, index) => {
      y = addLabelValue(doc, `URL ${index + 1}`, item.url || item.original_url || "—", y);
      y = addLabelValue(doc, "Action", item.action || item.verdict || "—", y);
      y = addLabelValue(doc, "Suspicion Score", item.suspicion_score ?? "—", y);

      const reasons = toStringArray(item.reasons);
      y = addBulletList(doc, "Reasons:", reasons, y);
    });
  }

  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `AI-Based Email Threat Detection System | Page ${i} of ${totalPages}`,
      14,
      290
    );
  }

  const filename = `email-threat-report-${fileSafe(
    email.subject || email.id || "email"
  )}.pdf`;

  doc.save(filename);
}