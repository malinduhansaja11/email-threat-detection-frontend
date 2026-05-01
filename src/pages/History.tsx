import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Collapse,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { getHistory, deleteHistory } from "../services/historyService";
import type { HistoryItem } from "../services/historyService";

function fmtDate(ts: any) {
  try {
    if (!ts) return "";
    if (typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString();
    }
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function getTypeColor(type?: string) {
  if (type === "obfuscation") return "error";
  if (type === "header") return "info";
  if (type === "time") return "secondary";
  if (type === "phishingLinks") return "warning";
  if (type === "fullScan") return "primary";
  return "default";
}

function getRiskLevelColor(level?: string) {
  const l = (level || "").toUpperCase();
  if (l === "CRITICAL" || l === "HIGH" || l === "BLOCK") return "error";
  if (l === "MEDIUM" || l === "WARN" || l === "WARNING") return "warning";
  if (l === "LOW" || l === "SAFE" || l === "ALLOW" || l === "CLEAN") return "success";
  return "default";
}

function getRiskColor(score?: number) {
  const value = score ?? 0;
  if (value >= 60) return "error";
  if (value >= 30) return "warning";
  return "success";
}

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((x) => {
      const subject = (x.subject ?? "").toLowerCase();
      const sender = (x.sender ?? "").toLowerCase();
      const tokens = (x.obf_tokens ?? []).join(" ").toLowerCase();
      const type = (x.type ?? "").toLowerCase();
      const source = (x.source ?? "").toLowerCase();
      const senderDomain = (x.sender_domain ?? "").toLowerCase();
      const verdict = (x.url_verdict ?? x.final_verdict ?? "").toLowerCase();
      const date = (x.email_date ?? "").toLowerCase();
      const preview = (x.body_preview ?? "").toLowerCase();
      const riskLevel = (x.risk_level ?? "").toLowerCase();
      const details = (x.details ?? []).join(" ").toLowerCase();
      const temporalFlags = (x.temporal_flags ?? []).join(" ").toLowerCase();
      const reasons = (x.final_reasons ?? []).join(" ").toLowerCase();

      return (
        subject.includes(s) ||
        sender.includes(s) ||
        tokens.includes(s) ||
        type.includes(s) ||
        source.includes(s) ||
        senderDomain.includes(s) ||
        verdict.includes(s) ||
        date.includes(s) ||
        preview.includes(s) ||
        riskLevel.includes(s) ||
        details.includes(s) ||
        temporalFlags.includes(s) ||
        reasons.includes(s)
      );
    });
  }, [items, q]);

  const onDelete = async (id: string) => {
    await deleteHistory(id);
    await load();
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Analysis History
        </Typography>

        <IconButton onClick={load} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Stack>

      <Card>
        <CardContent sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            fullWidth
            placeholder="Search by subject / sender / type / tokens / domain / verdict"
            size="small"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Chip
            label={loading ? "Loading..." : `${filtered.length} records`}
            sx={{ fontWeight: 700 }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {filtered.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              No history records found. Analyze an email first.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {filtered.map((h) => (
                <Box key={h.id}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 130px 44px",
                      gap: 1,
                      alignItems: "center",
                      py: 1.2,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {h.subject ?? "Analyzed Email"}
                      </Typography>

                      <Typography variant="body2" sx={{ opacity: 0.75 }}>
                        From: {h.sender ?? "unknown"} • {fmtDate(h.created_at)}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                        <Chip
                          size="small"
                          label={`Type: ${h.type ?? "unknown"}`}
                          color={getTypeColor(h.type) as any}
                        />
                        <Chip size="small" label={`Source: ${h.source}`} />
                      </Box>

                      {h.type === "obfuscation" && (
                        <>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                            <Chip
                              size="small"
                              label={`Risk: ${Math.round(h.risk_score ?? 0)}`}
                              color={getRiskColor(h.risk_score) as any}
                            />
                            <Chip size="small" label={`Tokens: ${(h.obf_tokens ?? []).length}`} />
                          </Box>

                          {(h.obf_tokens ?? []).length > 0 && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <b>Detected:</b> {(h.obf_tokens ?? []).slice(0, 8).join(", ")}
                              {(h.obf_tokens ?? []).length > 8 ? " ..." : ""}
                            </Typography>
                          )}
                        </>
                      )}

                      {h.type === "header" && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                            <Chip size="small" label={`Risk: ${h.risk_level || "unknown"}`} color={getRiskLevelColor(h.risk_level) as any} />
                            <Chip size="small" label={`Confidence: ${h.confidence ?? 0}%`} />
                            <Chip size="small" label={`SPF: ${h.spf ?? "—"}`} />
                            <Chip size="small" label={`DKIM: ${h.dkim ?? "—"}`} />
                            <Chip size="small" label={`DMARC: ${h.dmarc ?? "—"}`} />
                          </Box>
                          {(h.details && h.details.length > 0) && (
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              <b>Details:</b> {h.details.slice(0, 2).join(" • ")}
                              {h.details.length > 2 ? " ..." : ""}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {h.type === "time" && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                            <Chip size="small" label={`Risk: ${h.risk_level || "unknown"}`} color={getRiskLevelColor(h.risk_level) as any} />
                            <Chip size="small" label={`Confidence: ${h.confidence ?? 0}%`} />
                            <Chip size="small" label={`Date: ${h.email_date ?? "—"}`} />
                          </Box>
                          {(h.temporal_flags && h.temporal_flags.length > 0) && (
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              <b>Flags:</b> {h.temporal_flags.slice(0, 2).join(" • ")}
                              {h.temporal_flags.length > 2 ? " ..." : ""}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {h.type === "phishingLinks" && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Chip size="small" label={`URLs: ${h.url_count ?? 0}`} />
                            <Chip size="small" label={`Verdict: ${h.url_verdict ?? "unknown"}`} color={getRiskLevelColor(h.url_verdict) as any} />
                            {h.blocked_urls ? <Chip size="small" label={`Blocked: ${h.blocked_urls}`} color="error" /> : null}
                            {h.quarantine_urls ? <Chip size="small" label={`Quarantine: ${h.quarantine_urls}`} color="warning" /> : null}
                            {h.warned_urls ? <Chip size="small" label={`Warn: ${h.warned_urls}`} color="warning" /> : null}
                          </Box>
                        </Box>
                      )}

                      {h.type === "fullScan" && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                            <Chip size="small" label={`Verdict: ${h.final_verdict ?? "unknown"}`} color={getRiskLevelColor(h.final_verdict) as any} />
                            <Chip size="small" label={`Risk Score: ${h.final_risk_score ?? 0}%`} color={getRiskColor(h.final_risk_score) as any} />
                          </Box>
                          
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: "bold", mt: 0.5 }}>Modules:</Typography>
                            {h.module_summary?.obfuscation && <Chip size="small" variant="outlined" label="Obfuscation" color={h.module_summary.obfuscation.ok === false ? "warning" : "success"} />}
                            {h.module_summary?.temporal_evasion && <Chip size="small" variant="outlined" label="Temporal" color={h.module_summary.temporal_evasion.is_threat ? "error" : "success"} />}
                            {h.module_summary?.header_spoofing && <Chip size="small" variant="outlined" label="Header" color={h.module_summary.header_spoofing.is_threat ? "error" : "success"} />}
                            {h.module_summary?.url_threat && <Chip size="small" variant="outlined" label="URL" color={getRiskLevelColor(h.module_summary.url_threat.verdict) as any} />}
                          </Box>

                          {(h.final_reasons && h.final_reasons.length > 0) && (
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              <b>Reasons:</b> {h.final_reasons.slice(0, 2).join(" • ")}
                              {h.final_reasons.length > 2 ? " ..." : ""}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ justifySelf: "end", display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                      {h.type === "obfuscation" ? (
                        <Chip
                          label={
                            (h.risk_score ?? 0) >= 60
                              ? "High Risk"
                              : (h.risk_score ?? 0) >= 30
                              ? "Medium Risk"
                              : "Low Risk"
                          }
                          color={getRiskColor(h.risk_score) as any}
                          sx={{ fontWeight: 800 }}
                        />
                      ) : h.type === "header" || h.type === "time" ? (
                         <Chip
                          label={h.risk_level ?? "Unknown Risk"}
                          color={getRiskLevelColor(h.risk_level) as any}
                          sx={{ fontWeight: 800 }}
                        />
                      ) : h.type === "phishingLinks" ? (
                        <Chip
                          label={h.url_verdict ?? "Unknown Verdict"}
                          color={getRiskLevelColor(h.url_verdict) as any}
                          sx={{ fontWeight: 800 }}
                        />
                      ) : h.type === "fullScan" ? (
                        <Chip
                          label={h.final_verdict ?? "Unknown Verdict"}
                          color={getRiskLevelColor(h.final_verdict) as any}
                          sx={{ fontWeight: 800 }}
                        />
                      ) : (
                        <Chip
                          label={h.type ?? "Record"}
                          color={getTypeColor(h.type) as any}
                          sx={{ fontWeight: 800 }}
                        />
                      )}
                      
                      <Chip
                         label={h.type ?? "Record"}
                         variant="outlined"
                         size="small"
                         color={getTypeColor(h.type) as any}
                         sx={{ fontWeight: 600, mt: 0.5 }}
                       />
                    </Box>

                    <Box sx={{ justifySelf: "end", display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                      <IconButton onClick={() => onDelete(h.id)} title="Delete">
                        <DeleteIcon />
                      </IconButton>
                      {h.raw_result && (
                        <IconButton 
                          size="small" 
                          onClick={() => setExpandedId(expandedId === h.id ? null : h.id)} 
                          title="View Raw Result"
                        >
                          {expandedId === h.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  
                  {h.raw_result && (
                    <Collapse in={expandedId === h.id} unmountOnExit>
                      <Box sx={{ mx: 2, mb: 2, p: 1.5, bgcolor: "#f5f5f5", borderRadius: 2, overflow: "auto", maxHeight: 300 }}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(h.raw_result, null, 2)}
                        </Typography>
                      </Box>
                    </Collapse>
                  )}
                  
                  <Divider />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}