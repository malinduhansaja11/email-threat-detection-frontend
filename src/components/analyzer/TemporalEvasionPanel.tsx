// src/components/analyzer/TemporalEvasionPanel.tsx
// Time-based Analyzer — Global Temporal Evasion Detection
// Kaveesha Research | Sri Lanka CS Specialization

import { useState, useCallback } from "react";
import type { EmailItem } from "../../types/email";
import type {
  BatchSummary,
  TemporalResult,
  RiskLevel,
} from "../../types/temporalEvasion";
import {
  analyzeTemporalSingle,
  analyzeTemporalBatch,
} from "../../services/temporalEvasionService";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<
  RiskLevel,
  { bg: string; text: string; border: string; dot: string; solid: string }
> = {
  LOW: {
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
    dot: "#10b981",
    solid: "#10b981",
  },
  MEDIUM: {
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fcd34d",
    dot: "#f59e0b",
    solid: "#f59e0b",
  },
  HIGH: {
    bg: "#fff7ed",
    text: "#c2410c",
    border: "#fdba74",
    dot: "#f97316",
    solid: "#f97316",
  },
  CRITICAL: {
  bg: "#fef2f2",
  text: "#b91c1c",
  border: "#fecaca",
  dot: "#ef4444",
  solid: "#ef4444",
},
};

const RISK_ICON: Record<RiskLevel, string> = {
  LOW: "✓",
  MEDIUM: "⚠",
  HIGH: "▲",
  CRITICAL: "✕",
};

function riskBar(confidence: number, risk: RiskLevel) {
  const color =
    risk === "CRITICAL"
      ? "#ef4444"
      : risk === "HIGH"
      ? "#f97316"
      : risk === "MEDIUM"
      ? "#f59e0b"
      : "#10b981";

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#f3f4f6",
        borderRadius: 999,
        height: 6,
        mt: 1,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 6,
          borderRadius: 999,
          width: `${confidence}%`,
          bgcolor: color,
          transition: "width 700ms ease",
        }}
      />
    </Box>
  );
}

function formatDrift(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type FlexibleEmail = EmailItem & {
  sender?: string;
  from?: string;
  date?: string;
  received_at?: string;
};

function getEmailSender(email?: FlexibleEmail | null): string {
  return email?.sender ?? email?.from ?? "";
}

function getEmailDate(email?: FlexibleEmail | null): string {
  return email?.date ?? email?.received_at ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TemporalClockFace({ hour }: { hour: number }) {
  const angle = (hour / 24) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = 40,
    cy = 40,
    r = 28;
  const hx = cx + r * Math.cos(rad);
  const hy = cy + r * Math.sin(rad);
  const suspicious = hour < 6 || hour >= 22;

  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle
        cx={cx}
        cy={cy}
        r={38}
        fill="none"
        stroke={suspicious ? "#fca5a5" : "#d1fae5"}
        strokeWidth="1.5"
      />
      <path
        d={`M ${cx + 38 * Math.cos((330 * Math.PI) / 180)} ${
          cy + 38 * Math.sin((330 * Math.PI) / 180)
        } A 38 38 0 0 1 ${cx + 38 * Math.cos((450 * Math.PI) / 180)} ${
          cy + 38 * Math.sin((450 * Math.PI) / 180)
        }`}
        fill="none"
        stroke="#fca5a5"
        strokeWidth="5"
        opacity="0.4"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={suspicious ? "#fff1f2" : "#f0fdf4"}
        stroke={suspicious ? "#f87171" : "#6ee7b7"}
        strokeWidth="1"
      />
      {Array.from({ length: 24 }, (_, i) => {
        const a = ((i / 24) * 360 - 90) * (Math.PI / 180);
        const inner = i % 6 === 0 ? 20 : 24;
        return (
          <line
            key={i}
            x1={cx + inner * Math.cos(a)}
            y1={cy + inner * Math.sin(a)}
            x2={cx + 28 * Math.cos(a)}
            y2={cy + 28 * Math.sin(a)}
            stroke={suspicious ? "#f87171" : "#6ee7b7"}
            strokeWidth={i % 6 === 0 ? 2 : 0.8}
            opacity="0.7"
          />
        );
      })}
      <line
        x1={cx}
        y1={cy}
        x2={hx}
        y2={hy}
        stroke={suspicious ? "#dc2626" : "#059669"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="2.5" fill={suspicious ? "#dc2626" : "#059669"} />
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize="8"
        fill={suspicious ? "#dc2626" : "#065f46"}
        fontWeight="700"
      >
        {String(hour).padStart(2, "0")}:00
      </text>
    </svg>
  );
}

function MetricPill({
  label,
  value,
  alert,
}: {
  label: string;
  value: string | number;
  alert?: boolean;
}) {
  return (
    <Box
  sx={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    px: 1.5,
    py: 1.25,
    borderRadius: 2.5,
    border: "1px solid",
    borderColor: alert ? "#fecaca" : "#e5e7eb",
    bgcolor: alert ? "#fff5f5" : "#ffffff",
    minWidth: 0,
    minHeight: 66,
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  }}
>
  <Typography
    sx={{
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: alert ? "#dc2626" : "#94a3b8",
      mb: 0.5,
    }}
  >
    {label}
  </Typography>

  <Typography
    sx={{
      fontSize: 13,
      fontWeight: 800,
      color: alert ? "#991b1b" : "#1f2937",
      textAlign: "center",
      lineHeight: 1.25,
    }}
  >
    {value}
  </Typography>
</Box>
  );
}

function SingleResultCard({ result }: { result: TemporalResult }) {
  const c = RISK_COLORS[result.risk_level];
  const feats = result.temporal;

  return (
    <Card
  elevation={0}
  sx={{
    borderRadius: 3,
    border: "1px solid",
    borderColor: c.border,
    bgcolor: "#ffffff",
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
  }}
>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <TemporalClockFace hour={feats.hour} />

            <Box
              sx={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1,
                width: "100%",
              }}
            >
              <MetricPill label="Day" value={DAYS[feats.day_of_week] ?? "?"} />
              <MetricPill
                label="Drift"
                value={formatDrift(feats.time_drift)}
                alert={feats.time_drift > 3600}
              />
              <MetricPill
                label="Burst"
                value={feats.burst_count}
                alert={feats.is_burst === 1}
              />
              <MetricPill
                label="Hours"
                value={feats.is_suspicious_time ? "Off-hours" : "Business"}
                alert={!!feats.is_suspicious_time}
              />
              <MetricPill
                label="Weekend"
                value={feats.is_weekend ? "Yes" : "No"}
                alert={!!feats.is_weekend}
              />
              <MetricPill
                label="Anomaly"
                value={feats.is_anomaly ? "Ghost" : "None"}
                alert={!!feats.is_anomaly}
              />
            </Box>
          </Stack>

          {result.flags.length > 0 && (
            <Stack spacing={1}>
              {result.flags.map((flag, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                  <Typography sx={{ color: "#f87171", fontSize: 12, mt: "2px" }}>
                    ⚑
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>
  {flag}
</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function BatchDonut({ summary }: { summary: BatchSummary }) {
  const { total, critical, high, medium, low } = summary;
  if (total === 0) return null;

  const r = 32,
    cx = 40,
    cy = 40,
    stroke = 14;
  const circ = 2 * Math.PI * r;

  type Seg = { label: string; count: number; color: string };
  const segments: Seg[] = [
    { label: "Critical", count: critical, color: "#ef4444" },
    { label: "High", count: high, color: "#f97316" },
    { label: "Medium", count: medium, color: "#f59e0b" },
    { label: "Low", count: low, color: "#10b981" },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.count / total;
    const dash = pct * circ;
    const arc = { ...seg, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${circ - a.dash}`}
            strokeDashoffset={-a.offset + circ * 0.25}
            strokeLinecap="butt"
          />
        ))}
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontWeight="800"
          fill="#111827"
        >
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="6" fill="#6b7280">
          emails
        </text>
      </svg>

      <Stack spacing={1}>
        {segments.map((s) => (
          <Stack key={s.label} direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: s.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 12, color: "#6b7280", width: 60 }}>
              {s.label}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#111827" }}>
              {s.count}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  selectedEmail?: FlexibleEmail | null;
  inboxEmails?: FlexibleEmail[];
}

type Mode = "single" | "batch";

export default function TemporalEvasionPanel({
  selectedEmail,
  inboxEmails = [],
}: Props) {
  const [mode, setMode] = useState<Mode>("single");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<TemporalResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchSummary | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const runSingle = useCallback(async () => {
    if (!selectedEmail) return;

    setLoading(true);
    setError(null);
    setSingleResult(null);

    try {
      const res = await analyzeTemporalSingle({
        subject: selectedEmail.subject ?? "",
        body: selectedEmail.body ?? "",
        date: getEmailDate(selectedEmail),
        sender: getEmailSender(selectedEmail),
        burst_count: 1,
      });
      setSingleResult(res);

      import("../../services/analysisHistoryMappers").then(({ saveTemporalHistory }) => {
        saveTemporalHistory({
          source: "gmail",
          sender: getEmailSender(selectedEmail),
          subject: selectedEmail.subject,
          email_date: getEmailDate(selectedEmail),
          body: selectedEmail.body,
          risk_level: res.risk_level,
          confidence: res.confidence,
          is_threat: res.prediction.toLowerCase() === "spam",
          threat_type: res.prediction,
          model_used: (res as any).model_used || "Temporal Model",
          temporal_flags: res.flags,
          temporal_features: res.temporal,
          raw_result: res,
        });
      }).catch(err => console.error(err));

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [selectedEmail]);

  const runBatch = useCallback(async () => {
    if (inboxEmails.length === 0) return;

    setLoading(true);
    setError(null);
    setBatchResult(null);

    try {
      const res = await analyzeTemporalBatch({
        emails: inboxEmails.map((e) => ({
          id: e.id ?? "",
          subject: e.subject ?? "",
          body: e.body ?? "",
          date: getEmailDate(e),
          sender: getEmailSender(e),
        })),
      });
      setBatchResult(res);

      import("../../services/analysisHistoryMappers").then(({ saveTemporalHistory }) => {
        res.results.forEach((r) => {
          const email = inboxEmails.find((e) => e.id === r.id);
          saveTemporalHistory({
            source: "gmail",
            sender: email ? getEmailSender(email) : "",
            subject: email?.subject || r.id,
            email_date: email ? getEmailDate(email) : "",
            body: email?.body,
            risk_level: r.risk_level,
            confidence: r.confidence,
            is_threat: r.prediction.toLowerCase() === "spam",
            threat_type: r.prediction,
            model_used: (r as any).model_used || "Temporal Model",
            temporal_flags: r.flags,
            temporal_features: r.temporal,
            raw_result: r,
          });
        });
      }).catch(err => console.error(err));

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Batch analysis failed");
    } finally {
      setLoading(false);
    }
  }, [inboxEmails]);

  const handleAnalyze = () => (mode === "single" ? runSingle() : runBatch());

  const sortedBatch =
    batchResult?.results.slice().sort((a, b) => b.confidence - a.confidence) ?? [];

  return (
    <Card
  elevation={0}
  sx={{
    display: "flex",
    flexDirection: "column",
    height: "100%",
    bgcolor: "#ffffff",
    borderRadius: 3,
    border: "1px solid",
    borderColor: "#dbe4ee",
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
  }}
>
      <Box
  sx={{
    px: 2.5,
    py: 2,
    borderBottom: "1px solid",
    borderColor: "#dbeafe",
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 45%, #ffffff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
    flexWrap: "wrap",
  }}
>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Typography sx={{ fontSize: 18 }}>⏱</Typography>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 }}>
  Time-based Analyzer
</Typography>
<Typography sx={{ fontSize: 11, color: "#64748b", lineHeight: 1.4, mt: 0.25 }}>
  Detect off-hours activity, burst campaigns, and suspicious temporal behavior.
</Typography>
          </Box>
        </Stack>

        <Box
  sx={{
    display: "flex",
    alignItems: "center",
    bgcolor: "#ffffff",
    borderRadius: 2,
    p: 0.5,
    gap: 0.5,
    border: "1px solid #dbe4ee",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  }}
>
  <Button
    size="small"
    onClick={() => setMode("single")}
    sx={{
      px: 1.8,
      py: 0.7,
      borderRadius: 1.5,
      textTransform: "none",
      fontSize: 12,
      fontWeight: 800,
      bgcolor: mode === "single" ? "#2563eb" : "transparent",
      color: mode === "single" ? "#ffffff" : "#64748b",
      "&:hover": {
        bgcolor: mode === "single" ? "#1d4ed8" : "#f8fafc",
      },
    }}
  >
    Single
  </Button>

  <Button
    size="small"
    onClick={() => setMode("batch")}
    sx={{
      px: 1.8,
      py: 0.7,
      borderRadius: 1.5,
      textTransform: "none",
      fontSize: 12,
      fontWeight: 800,
      bgcolor: mode === "batch" ? "#0f172a" : "transparent",
      color: mode === "batch" ? "#ffffff" : "#64748b",
      "&:hover": {
        bgcolor: mode === "batch" ? "#1e293b" : "#f8fafc",
      },
    }}
  >
    Batch
  </Button>
</Box>
      </Box>

      <Box
  sx={{
    flex: 1,
    overflowY: "auto",
    p: 2,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    bgcolor: "#f8fafc",
  }}
>
        {mode === "single" && selectedEmail ? (
          <Box
            sx={{
  display: "flex",
  alignItems: "flex-start",
  gap: 1.5,
  p: 1.75,
  borderRadius: 2.5,
  bgcolor: "#ffffff",
  border: "1px solid",
  borderColor: "#dbeafe",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
}}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: "#dbeafe",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              @
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>
                {selectedEmail.subject || "(no subject)"}
              </Typography>
              <Typography sx={{ fontSize: 10, color: "#6b7280" }}>
                {getEmailSender(selectedEmail)}
              </Typography>
              <Typography sx={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace", mt: 0.5 }}>
                {getEmailDate(selectedEmail)}
              </Typography>
            </Box>
          </Box>
        ) : mode === "single" ? (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#fffbeb",
              border: "1px solid",
              borderColor: "#fde68a",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#b45309", textAlign: "center" }}>
              Select an email from the Inbox to analyze its temporal signature.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#eef2ff",
              border: "1px solid",
              borderColor: "#c7d2fe",
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#3730a3" }}>
              Inbox Burst Scan
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#6366f1", mt: 0.5 }}>
              Scans all {inboxEmails.length} inbox emails simultaneously. Detects
              coordinated send bursts, off-hours patterns, and ghost anomalies across
              the full dataset.
            </Typography>
          </Box>
        )}

        {error && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#fef2f2",
              border: "1px solid",
              borderColor: "#fecaca",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#b91c1c" }}>⚠ {error}</Typography>
          </Box>
        )}

        {singleResult && <SingleResultCard result={singleResult} />}

        {batchResult && (
          <Stack spacing={2}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: "#f8fafc",
                border: "1px solid",
                borderColor: "#e2e8f0",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#374151",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        Inbox Scan Complete
                      </Typography>

                      {batchResult.burst_detected && (
                        <Chip
                          size="small"
                          label="Burst Pattern Detected"
                          sx={{
                            mt: 1,
                            bgcolor: "#fee2e2",
                            color: "#b91c1c",
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ textAlign: "right" }}>
                      <Typography sx={{ fontSize: 28, fontWeight: 900, color: "#dc2626", lineHeight: 1 }}>
                        {batchResult.spam}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>
                        threats / {batchResult.total}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <BatchDonut summary={batchResult} />
                </Stack>
              </CardContent>
            </Card>

            <Box>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  px: 0.5,
                  mb: 1,
                }}
              >
                Per-email Results (sorted by risk)
              </Typography>

              <Stack spacing={1}>
                {sortedBatch.map((r) => {
                  const c = RISK_COLORS[r.risk_level];
                  const ex = expandedId === r.id;

                  return (
                    <Card
                      key={r.id}
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: c.border,
                        overflow: "hidden",
                      }}
                    >
                      <Button
                        fullWidth
                        onClick={() => setExpandedId(ex ? null : r.id)}
                        sx={{
                          justifyContent: "flex-start",
                          px: 1.5,
                          py: 1.25,
                          bgcolor: c.bg,
                          color: "#111827",
                          textTransform: "none",
                          borderRadius: 0,
                          "&:hover": { bgcolor: c.bg, filter: "brightness(0.98)" },
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                          sx={{ width: "100%" }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              bgcolor: c.dot,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 900,
                              flexShrink: 0,
                            }}
                          >
                            {RISK_ICON[r.risk_level]}
                          </Box>

                          <Typography
                            sx={{
                              flex: 1,
                              fontSize: 12,
                              color: "#374151",
                              fontWeight: 500,
                              textAlign: "left",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.id}
                          </Typography>

                          <Typography sx={{ fontSize: 12, fontWeight: 800, color: c.text }}>
                            {r.confidence.toFixed(0)}%
                          </Typography>

                          <Chip
                            size="small"
                            label={r.risk_level}
                            sx={{
                              bgcolor: c.bg,
                              color: c.text,
                              border: "1px solid",
                              borderColor: c.border,
                              fontSize: 10,
                              fontWeight: 800,
                            }}
                          />

                          <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                            {ex ? "▲" : "▼"}
                          </Typography>
                        </Stack>
                      </Button>

                      {ex && (
                        <Box sx={{ px: 1.5, pb: 1.5, pt: 1, bgcolor: "#fff", borderTop: "1px solid #f3f4f6" }}>
                          <SingleResultCard result={r} />
                        </Box>
                      )}
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "#f3f4f6",
          px: 2,
          py: 1.5,
          bgcolor: "#fff",
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={handleAnalyze}
          disabled={
            loading ||
            (mode === "single" && !selectedEmail) ||
            (mode === "batch" && inboxEmails.length === 0)
          }
          sx={{
  py: 1.35,
  borderRadius: 2.5,
  fontSize: 14,
  fontWeight: 900,
  textTransform: "none",
  background: loading
    ? "#e5e7eb"
    : mode === "single"
    ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
    : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  color: loading ? "#94a3b8" : "#ffffff",
  boxShadow: loading ? "none" : "0 10px 20px rgba(15,23,42,0.14)",
  "&:hover": {
    background: loading
      ? "#e5e7eb"
      : mode === "single"
      ? "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)"
      : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    boxShadow: loading ? "none" : "0 12px 22px rgba(15,23,42,0.16)",
  },
}}
        >
          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} sx={{ color: "currentColor" }} />
              <span>
                {mode === "batch"
                  ? `Scanning ${inboxEmails.length} emails…`
                  : "Analyzing…"}
              </span>
            </Stack>
          ) : mode === "single" ? (
            "▶  Run Temporal Analysis"
          ) : (
            `▶  Scan All ${inboxEmails.length} Inbox Emails`
          )}
        </Button>

        <Typography
          sx={{
            textAlign: "center",
            fontSize: 10,
            color: "#9ca3af",
            mt: 1.5,
          }}
        >
       
        </Typography>
      </Box>
    </Card>
  );
}