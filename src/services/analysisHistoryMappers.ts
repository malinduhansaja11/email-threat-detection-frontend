import { saveHistory } from "./historyService";

export const getSource = (emailSource?: string | null): string => {
  if (!emailSource) return "manual";
  if (emailSource.toLowerCase().includes("gmail")) return "gmail";
  if (emailSource.toLowerCase().includes("demo")) return "demo";
  return "manual";
};

export const getBodyPreview = (body?: string | null): string => {
  if (!body) return "";
  return body.substring(0, 200);
};

export const saveObfuscationHistory = async (data: any) => {
  try {
    await saveHistory({
      type: "obfuscation",
      source: getSource(data.source),
      sender: data.sender || "",
      subject: data.subject || "",
      risk_score: data.risk_score || 0,
      obf_tokens: data.obf_tokens || [],
      body_preview: getBodyPreview(data.body),
      raw_result: data.raw_result || null,
    });
  } catch (error) {
    console.error("Failed to save obfuscation history:", error);
  }
};

export const saveHeaderHistory = async (data: any) => {
  try {
    await saveHistory({
      type: "header",
      source: getSource(data.source),
      sender: data.sender || "",
      subject: data.subject || "",
      spf: data.spf || "",
      dkim: data.dkim || "",
      dmarc: data.dmarc || "",
      sender_domain: data.sender_domain || "",
      header_count: data.header_count || 0,
      risk_level: data.risk_level || "",
      confidence: data.confidence || 0,
      is_threat: data.is_threat || false,
      threat_type: data.threat_type || "",
      model_used: data.model_used || "",
      details: data.details || [],
      scores: data.scores || {},
      raw_result: data.raw_result || null,
      body_preview: getBodyPreview(data.body),
    });
  } catch (error) {
    console.error("Failed to save header history:", error);
  }
};

export const saveTemporalHistory = async (data: any) => {
  try {
    await saveHistory({
      type: "time",
      source: getSource(data.source),
      sender: data.sender || "",
      subject: data.subject || "",
      email_date: data.email_date || "",
      body_preview: getBodyPreview(data.body),
      risk_level: data.risk_level || "",
      confidence: data.confidence || 0,
      is_threat: data.is_threat || false,
      threat_type: data.threat_type || "",
      model_used: data.model_used || "",
      temporal_flags: data.temporal_flags || [],
      temporal_features: data.temporal_features || {},
      raw_result: data.raw_result || null,
    });
  } catch (error) {
    console.error("Failed to save temporal history:", error);
  }
};

export const saveUrlHistory = async (data: any) => {
  try {
    await saveHistory({
      type: "phishingLinks",
      source: getSource(data.source),
      sender: data.sender || "",
      subject: data.subject || "",
      url_count: data.url_count || 0,
      url_verdict: data.url_verdict || "",
      urls: data.urls || [],
      blocked_urls: data.blocked_urls || 0,
      quarantine_urls: data.quarantine_urls || 0,
      warned_urls: data.warned_urls || 0,
      allowed_urls: data.allowed_urls || 0,
      max_score: data.max_score || 0,
      raw_result: data.raw_result || null,
    });
  } catch (error) {
    console.error("Failed to save url history:", error);
  }
};

export const saveFullScanHistory = async (data: any) => {
  try {
    await saveHistory({
      type: "fullScan",
      source: getSource(data.source),
      sender: data.sender || "",
      subject: data.subject || "",
      email_date: data.email_date || "",
      body_preview: getBodyPreview(data.body),
      final_verdict: data.final_verdict || "",
      final_risk_score: data.final_risk_score || 0,
      final_is_threat: data.final_is_threat || false,
      final_reasons: data.final_reasons || [],
      failed_modules: data.failed_modules || [],
      module_summary: data.module_summary || {},
      obfuscation_result: data.obfuscation_result || null,
      temporal_result: data.temporal_result || null,
      header_result: data.header_result || null,
      url_result: data.url_result || null,
      raw_result: data.raw_result || null,
    });
  } catch (error) {
    console.error("Failed to save full scan history:", error);
  }
};
