/// src/components/analyzer/HeaderSpoofingPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full UI for the "Header Analyzer" section inside the existing Analyzer page.
// Replaces the "Coming Next" placeholder for the `header` section.

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HdrStrongOutlinedIcon from "@mui/icons-material/HdrStrongOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { useEffect, useState } from "react";
import { analyzeHeaderSpoofing } from "../../services/headerSpoofingService";
import type {
  HeaderSpoofingRequest,
  HeaderSpoofingResponse,
  FeatureScores,
  RiskLevel,
} from "../../types/headerSpoofing";

type AuthStatus = "pass" | "fail" | "unknown" | string;

type HeaderSpoofingPanelProps = {
  headers?: Record<string, string>;
  sender?: string;
  subject?: string;
  body?: string;
  replyTo?: string;
  dkim?: AuthStatus | boolean;
  spf?: AuthStatus | boolean;
  dmarc?: AuthStatus | boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_PALETTE: Record<RiskLevel, { bg: string; color: string; label: string }> = {
  safe: { bg: "#e6f4ea", color: "#0f9d58", label: "Safe" },
  low: { bg: "#fef3e2", color: "#e37400", label: "Low Risk" },
  medium: { bg: "#fff3cd", color: "#e65100", label: "Medium" },
  high: { bg: "#fce8e6", color: "#d93025", label: "High Risk" },
  critical: { bg: "#fce8e6", color: "#b31412", label: "Critical" },
};

const SCORE_LABELS: Record<keyof FeatureScores, string> = {
  sender: "Sender Trust",
  link: "Link Safety",
  language: "Language Risk",
  header_auth: "Header Auth (DKIM/SPF)",
  server: "Server Trust",
  login: "Login Keyword Risk",
  path: "Path Safety",
  attachment: "Attachment Safety",
};

function scoreColor(val: number): string {
  if (val >= 0.7) return "#0f9d58";
  if (val >= 0.45) return "#f29900";
  return "#d93025";
}

function toBoolStatus(value?: AuthStatus | boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "pass" || normalized === "true";
  }
  return false;
}

function getHeaderValue(headers?: Record<string, string>, key?: string): string {
  if (!headers || !key) return "";
  return (
    headers[key] ??
    headers[key.toLowerCase()] ??
    headers[key.toUpperCase()] ??
    ""
  );
}

function getAuthenticationResults(headers?: Record<string, string>): string {
  return (
    getHeaderValue(headers, "Authentication-Results") ||
    getHeaderValue(headers, "authentication-results")
  );
}

function extractAuthResult(
  headers: Record<string, string> | undefined,
  directValue: AuthStatus | boolean | undefined,
  type: "dkim" | "spf" | "dmarc"
): boolean {
  if (directValue !== undefined) return toBoolStatus(directValue);

  const authResults = getAuthenticationResults(headers).toLowerCase();
  if (!authResults) return false;

  const passPatterns = [
    `${type}=pass`,
    `${type} = pass`,
    `${type}=bestguesspass`,
    `${type} = bestguesspass`,
  ];

  return passPatterns.some((pattern) => authResults.includes(pattern));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const pct = Math.round(value * 100);
  const color = scoreColor(value);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
        <Typography variant="caption" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
          {pct}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 7,
          borderRadius: 4,
          bgcolor: "#f1f3f4",
          "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: color },
        }}
      />
    </Box>
  );
}

function VerdictBanner({ result }: { result: HeaderSpoofingResponse }) {
  const { bg, color, label } = RISK_PALETTE[result.risk_level];

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: color,
        bgcolor: bg,
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {result.is_threat ? (
        <WarningAmberOutlinedIcon sx={{ fontSize: 40, color }} />
      ) : (
        <CheckCircleOutlineIcon sx={{ fontSize: 40, color }} />
      )}

      <Box>
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Typography variant="h5" fontWeight={900} sx={{ color }}>
            {result.is_threat ? "⚠ Threat Detected" : "✓ Email Looks Safe"}
          </Typography>
          <Chip
            label={label}
            size="small"
            sx={{ bgcolor: color, color: "#fff", fontWeight: 800, borderRadius: 2 }}
          />
        </Stack>

        <Typography variant="body2" sx={{ mt: 0.4, color }}>
          {result.threat_type} &nbsp;·&nbsp; Confidence: {result.confidence.toFixed(1)}%
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Model: {result.model_used}
        </Typography>
      </Box>
    </Box>
  );
}

function DetailsCard({ details }: { details: string[] }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <InfoOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={800}>
            Analysis Details
          </Typography>
        </Stack>

        <Stack spacing={0.8}>
          {details.map((d, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
              <Box component="span" sx={{ mt: "3px", fontSize: 13, lineHeight: 1 }}>
                {d.startsWith("All header") ? "✅" : "⚠"}
              </Box>
              <Typography variant="body2">{d}</Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ScoresCard({ scores }: { scores: FeatureScores }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
          Feature Scores (8 dimensions)
        </Typography>

        <Stack spacing={1.4}>
          {(Object.keys(SCORE_LABELS) as Array<keyof FeatureScores>).map((k) => (
            <FeatureBar key={k} label={SCORE_LABELS[k]} value={scores[k]} />
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          Higher = more trustworthy. Below 0.45 = suspicious.
        </Typography>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const SAMPLE_SPAM: HeaderSpoofingRequest = {
  email_from: "billing@susp1c10us-bank.tk",
  subject: "URGENT: verify your account NOW or it will be suspended",
  body: "Click here immediately to reset your p@ssw0rd. Your invoice2025 needs api_v2 confirmation. Act now or lose access!",
  reply_to: "harvest@different-domain.xyz",
  dkim: false,
  spf: false,
  has_attachment: true,
};

const SAMPLE_SAFE: HeaderSpoofingRequest = {
  email_from: "no-reply@github.com",
  subject: "Your pull request was merged",
  body: "Hi team, your pull request #42 has been merged into main. Thanks for the contribution!",
  reply_to: "",
  dkim: true,
  spf: true,
  has_attachment: false,
};

export default function HeaderSpoofingPanel({
  headers,
  sender,
  subject,
  body,
  replyTo,
  dkim,
  spf,
}: HeaderSpoofingPanelProps) {
  const [form, setForm] = useState<HeaderSpoofingRequest>({
    email_from: sender || getHeaderValue(headers, "From") || "",
    subject: subject || getHeaderValue(headers, "Subject") || "",
    body: body || "",
    reply_to: replyTo || getHeaderValue(headers, "Reply-To") || "",
    dkim: extractAuthResult(headers, dkim, "dkim"),
    spf: extractAuthResult(headers, spf, "spf"),
    has_attachment: false,
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      email_from: sender || getHeaderValue(headers, "From") || "",
      subject: subject || getHeaderValue(headers, "Subject") || "",
      body: body || prev.body || "",
      reply_to: replyTo || getHeaderValue(headers, "Reply-To") || "",
      dkim: extractAuthResult(headers, dkim, "dkim"),
      spf: extractAuthResult(headers, spf, "spf"),
    }));
  }, [headers, sender, subject, body, replyTo, dkim, spf]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HeaderSpoofingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set =
    (field: keyof HeaderSpoofingRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const setBool =
    (field: keyof HeaderSpoofingRequest) =>
    (_: React.SyntheticEvent, checked: boolean) =>
      setForm((p) => ({ ...p, [field]: checked }));

  const loadSample = (safe: boolean) => {
    setForm(safe ? SAMPLE_SAFE : SAMPLE_SPAM);
    setResult(null);
    setError(null);
  };

  const onAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyzeHeaderSpoofing(form);
      setResult(res);
    } catch (err: any) {
      setError(err?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = !loading && (!!form.email_from.trim() || !!form.body.trim());

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <HdrStrongOutlinedIcon color="primary" />
            <Typography variant="h6" fontWeight={900}>
              Header Spoofing Analyzer
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="From (sender address)"
                placeholder="billing@example.com"
                value={form.email_from}
                onChange={set("email_from")}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Reply-To (leave blank if same as From)"
                placeholder="different@otherdomain.com"
                value={form.reply_to}
                onChange={set("reply_to")}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Subject"
                placeholder="Email subject line"
                value={form.subject}
                onChange={set("subject")}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Email Body"
                placeholder="Paste the email body here…"
                value={form.body}
                onChange={set("body")}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={3} sx={{ mt: 2 }} flexWrap="wrap">
            <Tooltip title="DKIM — DomainKeys Identified Mail signature present and valid">
              <FormControlLabel
                control={<Switch checked={form.dkim} onChange={setBool("dkim")} color="success" />}
                label={<Typography variant="body2" fontWeight={600}>DKIM Pass</Typography>}
              />
            </Tooltip>

            <Tooltip title="SPF — Sender Policy Framework record valid">
              <FormControlLabel
                control={<Switch checked={form.spf} onChange={setBool("spf")} color="success" />}
                label={<Typography variant="body2" fontWeight={600}>SPF Pass</Typography>}
              />
            </Tooltip>

            <Tooltip title="Email contains file attachments">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.has_attachment}
                    onChange={setBool("has_attachment")}
                    color="warning"
                  />
                }
                label={<Typography variant="body2" fontWeight={600}>Has Attachment</Typography>}
              />
            </Tooltip>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="contained"
              onClick={onAnalyze}
              disabled={!canAnalyze}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ borderRadius: 2, fontWeight: 800 }}
            >
              {loading ? "Analyzing…" : "Detect Header Spoofing"}
            </Button>

            <Button
              variant="outlined"
              color="error"
              onClick={() => loadSample(false)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Load Spam Sample
            </Button>

            <Button
              variant="outlined"
              color="success"
              onClick={() => loadSample(true)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Load Safe Sample
            </Button>

            <Button
              variant="text"
              color="inherit"
              onClick={() => {
                setForm({
                  email_from: "",
                  subject: "",
                  body: "",
                  reply_to: "",
                  dkim: true,
                  spf: true,
                  has_attachment: false,
                });
                setResult(null);
                setError(null);
              }}
              sx={{ borderRadius: 2 }}
            >
              Clear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <VerdictBanner result={result} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <DetailsCard details={result.details} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <ScoresCard scores={result.scores} />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}