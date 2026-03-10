// src/components/analyzer/TemporalEvasionPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full UI for the "Time-based Analyzer" tab inside the existing Analyzer page.
// Replaces the "Coming Next" placeholder for the `time` section.

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AccessTimeIcon           from "@mui/icons-material/AccessTime";
import CheckCircleOutlineIcon   from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon         from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon         from "@mui/icons-material/InfoOutlined";
import ScheduleOutlinedIcon     from "@mui/icons-material/ScheduleOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { useState } from "react";
import { analyzeTemporalEvasion } from "../../services/temporalEvasionService";
import type {
  TemporalEvasionRequest,
  TemporalEvasionResponse,
  TemporalFeatures,
  RiskLevel,
} from "../../types/temporalEvasion";

// ── colour palette ────────────────────────────────────────────────────────────

const RISK_PALETTE: Record<RiskLevel, { bg: string; border: string; text: string; label: string }> = {
  safe:     { bg: "#e6f4ea", border: "#0f9d58", text: "#0f9d58", label: "Safe"      },
  low:      { bg: "#fef3e2", border: "#e37400", text: "#e37400", label: "Low Risk"  },
  medium:   { bg: "#fff8e1", border: "#e65100", text: "#e65100", label: "Medium"    },
  high:     { bg: "#fce8e6", border: "#d93025", text: "#d93025", label: "High Risk" },
  critical: { bg: "#fce8e6", border: "#b31412", text: "#b31412", label: "Critical"  },
};

// ── sample data ───────────────────────────────────────────────────────────────

const SAMPLE_EVASION: TemporalEvasionRequest = {
  subject:     "URGENT ACTION REQUIRED — account will be suspended in 2 hours",
  body:        "Click here immediately to reset your password or lose access to your account forever.",
  sent_at:     "2025-03-10T03:14:00",
  burst_count: 22,
};

const SAMPLE_GHOST: TemporalEvasionRequest = {
  subject:     "System Notification — routine maintenance scheduled",
  body:        "No action needed. Maintenance window at midnight. This is an automated message.",
  sent_at:     "2025-03-09T00:05:00",
  burst_count: 150,
};

const SAMPLE_CLEAN: TemporalEvasionRequest = {
  subject:     "Project Update — specialization forms attached for review",
  body:        "Hi team, please find the 2026 Q1 report attached. Let me know if you have any questions.",
  sent_at:     "2025-03-10T10:30:00",
  burst_count: 1,
};

// ── helpers ───────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString().slice(0, 16);
}

function hourLabel(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${ampm}`;
}

const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ── sub-components ────────────────────────────────────────────────────────────

function VerdictBanner({ result }: { result: TemporalEvasionResponse }) {
  const pal = RISK_PALETTE[result.risk_level];
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1.5px solid ${pal.border}`,
        bgcolor: pal.bg,
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {result.is_threat
        ? <WarningAmberOutlinedIcon sx={{ fontSize: 44, color: pal.text }} />
        : <CheckCircleOutlineIcon  sx={{ fontSize: 44, color: pal.text }} />}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h5" fontWeight={900} sx={{ color: pal.text }}>
            {result.is_threat ? "⚠ Temporal Evasion Detected" : "✓ Normal Timing Pattern"}
          </Typography>
          <Chip
            label={pal.label} size="small"
            sx={{ bgcolor: pal.border, color: "#fff", fontWeight: 800, borderRadius: 2 }}
          />
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.4, color: pal.text }}>
          {result.threat_type}&nbsp;·&nbsp;Confidence: {result.confidence.toFixed(1)}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Model: {result.model_used}
        </Typography>
      </Box>
    </Box>
  );
}

function TemporalRadar({ tf }: { tf: TemporalFeatures }) {
  const hour      = Math.round(tf.hour);
  const dow       = Math.round(tf.day_of_week);
  const driftH    = (tf.time_drift / 3600).toFixed(1);
  const burstCnt  = Math.round(tf.burst_count);

  type FlagItem = { label: string; value: string; flag: boolean; tip: string };
  const items: FlagItem[] = [
    {
      label: "Send Hour",
      value: hourLabel(hour),
      flag:  tf.is_suspicious_time === 1,
      tip:   "Suspicious if between 10 PM – 4 AM",
    },
    {
      label: "Day of Week",
      value: `${DAY_NAMES[dow]}${tf.is_weekend === 1 ? " (Weekend)" : ""}`,
      flag:  tf.is_weekend === 1,
      tip:   "Weekend sends are less common for legitimate senders",
    },
    {
      label: "Time Drift",
      value: `${driftH} h from 9 AM baseline`,
      flag:  tf.time_drift > 3600,
      tip:   "Drift > 1 h from normal business hours",
    },
    {
      label: "Burst Count",
      value: `${burstCnt} emails/hr`,
      flag:  tf.is_burst === 1,
      tip:   "Burst > 5 emails/hr = suspicious rate",
    },
    {
      label: "Anomaly Flag",
      value: tf.is_anomaly === 1 ? "Triggered" : "Clear",
      flag:  tf.is_anomaly === 1,
      tip:   "Set when off-hours + burst + urgency keywords all present",
    },
  ];

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <AccessTimeIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={800}>Temporal Signal Breakdown</Typography>
        </Stack>

        <Stack spacing={1.4}>
          {items.map((item) => (
            <Tooltip key={item.label} title={item.tip} placement="right">
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                  <Typography variant="caption" fontWeight={600}>{item.label}</Typography>
                  <Stack direction="row" spacing={0.6} alignItems="center">
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ color: item.flag ? "#d93025" : "#0f9d58" }}
                    >
                      {item.value}
                    </Typography>
                    {item.flag && (
                      <WarningAmberOutlinedIcon sx={{ fontSize: 13, color: "#d93025" }} />
                    )}
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={item.flag ? 100 : 20}
                  sx={{
                    height: 6, borderRadius: 4, bgcolor: "#f1f3f4",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      bgcolor: item.flag ? "#d93025" : "#0f9d58",
                    },
                  }}
                />
              </Box>
            </Tooltip>
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          Red = suspicious signal · Green = normal · Hover for explanation
        </Typography>
      </CardContent>
    </Card>
  );
}

function IndicatorsCard({ indicators }: { indicators: string[] }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <InfoOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={800}>Analysis Indicators</Typography>
        </Stack>
        <Stack spacing={0.9}>
          {indicators.map((line, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
              <Typography variant="body2">{line}</Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function RawFeaturesCard({ tf }: { tf: TemporalFeatures }) {
  const rows: [string, string][] = [
    ["hour",               tf.hour.toFixed(0)],
    ["hour_sin",           tf.hour_sin.toFixed(4)],
    ["hour_cos",           tf.hour_cos.toFixed(4)],
    ["is_suspicious_time", tf.is_suspicious_time.toFixed(0)],
    ["is_burst",           tf.is_burst.toFixed(0)],
    ["time_drift (s)",     tf.time_drift.toFixed(0)],
    ["day_of_week",        tf.day_of_week.toFixed(0)],
    ["is_weekend",         tf.is_weekend.toFixed(0)],
    ["arrival_epoch",      tf.arrival_epoch.toFixed(0)],
    ["burst_count",        tf.burst_count.toFixed(0)],
    ["is_anomaly",         tf.is_anomaly.toFixed(0)],
  ];

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
          Raw Feature Vector (11 dims)
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
          {rows.map(([name, val]) => (
            <Stack key={name} direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">{name}</Typography>
              <Typography variant="caption" fontWeight={700}>{val}</Typography>
            </Stack>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          These 11 values are concatenated with TF-IDF text features before inference.
        </Typography>
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TemporalEvasionPanel() {
  const [form, setForm] = useState<TemporalEvasionRequest>({
    subject:     "",
    body:        "",
    sent_at:     nowIso(),
    burst_count: 1,
  });

  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<TemporalEvasionResponse | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const setStr = (field: keyof TemporalEvasionRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const loadSample = (sample: TemporalEvasionRequest) => {
    setForm(sample);
    setResult(null);
    setError(null);
  };

  const onAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeTemporalEvasion({
        ...form,
        burst_count: Number(form.burst_count),
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = !loading && (!!form.subject.trim() || !!form.body.trim());

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

      {/* ── Input card ─────────────────────────────────────────────────── */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <ScheduleOutlinedIcon color="primary" />
            <Typography variant="h6" fontWeight={900}>Time-Based Evasion Analyzer</Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid  size={{ xs: 12 }}>
              <TextField
                fullWidth label="Subject"
                placeholder="Email subject line…"
                value={form.subject}
                onChange={setStr("subject")}
                size="small"
              />
            </Grid>

            <Grid  size={{ xs: 12 }}>
              <TextField
                fullWidth multiline minRows={5}
                label="Email Body"
                placeholder="Paste the email body here…"
                value={form.body}
                onChange={setStr("body")}
              />
            </Grid>

            <Grid  size={{ xs: 12, md: 6 }}>
              <Tooltip title="When was the email sent? Paste or type an ISO-8601 datetime.">
                <TextField
                  fullWidth
                  label="Sent At (date & time)"
                  type="datetime-local"
                  value={form.sent_at}
                  onChange={setStr("sent_at")}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Tooltip>
            </Grid>

            <Grid  size={{ xs: 12, md: 6 }}>
              <Tooltip title="How many emails arrived from this sender in the last hour? High counts signal burst behaviour.">
                <TextField
                  fullWidth
                  label="Burst Count (emails/hr from same sender)"
                  type="number"
                  inputProps={{ min: 1, max: 500 }}
                  value={form.burst_count}
                  onChange={setStr("burst_count")}
                  size="small"
                />
              </Tooltip>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Actions */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={onAnalyze}
              disabled={!canAnalyze}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ borderRadius: 2, fontWeight: 800 }}
            >
              {loading ? "Analyzing…" : "Detect Temporal Evasion"}
            </Button>

            <Button variant="outlined" color="error"
              onClick={() => loadSample(SAMPLE_EVASION)}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Load Evasion Sample
            </Button>

            <Button variant="outlined" color="warning"
              onClick={() => loadSample(SAMPLE_GHOST)}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Load Ghost Anomaly
            </Button>

            <Button variant="outlined" color="success"
              onClick={() => loadSample(SAMPLE_CLEAN)}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Load Clean Sample
            </Button>

            <Button variant="text" color="inherit"
              onClick={() => {
                setForm({ subject:"", body:"", sent_at: nowIso(), burst_count: 1 });
                setResult(null); setError(null);
              }}
              sx={{ borderRadius: 2 }}>
              Clear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* ── Scenario tip cards ────────────────────────────────────────── */}
      {!result && !loading && (
        <Paper elevation={0} sx={{
          borderRadius: 3, border: "1px dashed", borderColor: "divider",
          p: 2, bgcolor: "action.hover"
        }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
            📋 What this module detects
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs:"1fr", sm:"repeat(3,1fr)" }, gap: 1.5 }}>
            {[
              { icon: "🌙", title: "Off-Hours Sending", desc: "Emails sent between 10 PM – 4 AM to evade spam filters active during business hours." },
              { icon: "⚡", title: "Burst Activity",    desc: "High volume from one sender in a short window — typical of automated spam campaigns." },
              { icon: "👻", title: "Ghost Anomaly",     desc: "Neutral content + extreme timing signature. Evasion through temporal camouflage." },
            ].map((c) => (
              <Box key={c.title} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", p: 1.5, bgcolor: "background.paper" }}>
                <Typography variant="body2" fontWeight={800}>{c.icon} {c.title}</Typography>
                <Typography variant="caption" color="text.secondary">{c.desc}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* ── Results ──────────────────────────────────────────────────── */}
      {result && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <VerdictBanner result={result} />

          <Grid container spacing={2}>
            <Grid  size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                <IndicatorsCard indicators={result.indicators} />
                <TemporalRadar   tf={result.temporal_features} />
              </Stack>
            </Grid>
            <Grid  size={{ xs: 12, md: 5 }}>
              <RawFeaturesCard tf={result.temporal_features} />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}
