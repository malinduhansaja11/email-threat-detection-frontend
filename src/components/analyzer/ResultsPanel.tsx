import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import TokenOutlinedIcon from "@mui/icons-material/TokenOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import type { AnalyzeResponse } from "../../types/analyzer";

// ── Risk palette (mirrors HeaderSpoofingPanel) ────────────────────────────────

type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

const RISK_PALETTE: Record<RiskLevel, { bg: string; color: string; label: string }> = {
  safe:     { bg: "#e6f4ea", color: "#0f9d58", label: "Safe"     },
  low:      { bg: "#fef3e2", color: "#e37400", label: "Low Risk" },
  medium:   { bg: "#fff3cd", color: "#e65100", label: "Medium"   },
  high:     { bg: "#fce8e6", color: "#d93025", label: "High Risk"},
  critical: { bg: "#fce8e6", color: "#b31412", label: "Critical" },
};

function getRiskLevel(score: number): RiskLevel {
  if (score < 20)  return "safe";
  if (score < 40)  return "low";
  if (score < 60)  return "medium";
  if (score < 80)  return "high";
  return "critical";
}

function scoreColor(pct: number): string {
  if (pct < 40)  return "#0f9d58";
  if (pct < 65)  return "#f29900";
  return "#d93025";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VerdictBanner({ riskScore }: { riskScore: number }) {
  const level = getRiskLevel(riskScore);
  const { bg, color, label } = RISK_PALETTE[level];
  const isThreat = riskScore >= 40;

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
      {isThreat ? (
        <WarningAmberOutlinedIcon sx={{ fontSize: 40, color }} />
      ) : (
        <CheckCircleOutlineIcon sx={{ fontSize: 40, color }} />
      )}

      <Box>
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Typography variant="h5" fontWeight={900} sx={{ color }}>
            {isThreat ? "⚠ Obfuscation Detected" : "✓ No Obfuscation Found"}
          </Typography>
          <Chip
            label={label}
            size="small"
            sx={{ bgcolor: color, color: "#fff", fontWeight: 800, borderRadius: 2 }}
          />
        </Stack>

        <Typography variant="body2" sx={{ mt: 0.4, color }}>
          Risk Score: {riskScore}%
        </Typography>
      </Box>
    </Box>
  );
}

function RiskScoreCard({ riskScore }: { riskScore: number }) {
  const color = scoreColor(riskScore);

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <AssessmentOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={800}>
            Risk Score
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
          <Typography variant="h3" fontWeight={900} sx={{ color }}>
            {riskScore}
            <Typography component="span" variant="h5" fontWeight={700} sx={{ color }}>
              %
            </Typography>
          </Typography>
          <Chip
            label={RISK_PALETTE[getRiskLevel(riskScore)].label}
            size="small"
            sx={{
              bgcolor: color,
              color: "#fff",
              fontWeight: 800,
              borderRadius: 2,
            }}
          />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={riskScore}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "#f1f3f4",
            "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: color },
          }}
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          0% = fully clean · 100% = highly obfuscated
        </Typography>
      </CardContent>
    </Card>
  );
}

function ObfuscationTokensCard({
  tokens,
  labels,
  scores,
  obfTokens,
}: {
  tokens: string[];
  labels: number[];
  scores: number[];
  obfTokens: string[];
}) {
  const flagged = tokens.filter((_, idx) => labels[idx] !== 0);

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <TokenOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={800}>
            Obfuscation Tokens
          </Typography>
          {flagged.length > 0 && (
            <Chip
              label={`${flagged.length} flagged`}
              size="small"
              sx={{ bgcolor: "#fce8e6", color: "#d93025", fontWeight: 700, borderRadius: 2 }}
            />
          )}
        </Stack>

        <Stack direction="column" spacing={1} sx={{ maxHeight: 260, overflow: "auto" }}>
          {tokens.map((t, idx) => {
            if (labels[idx] === 0) return null;
            const pct = Math.round(scores[idx] * 100);
            const color = scoreColor(pct);

            return (
              <Box key={`${t}-${idx}`}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                  <Typography variant="caption" fontWeight={600}>
                    {t}
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
          })}

          {obfTokens.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No obfuscation detected.
            </Typography>
          )}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          Higher confidence = more likely obfuscated.
        </Typography>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ResultsPanel({ result }: { result: AnalyzeResponse | null }) {
  if (!result) {
    return (
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <AssessmentOutlinedIcon color="primary" />
            <Typography variant="h6" fontWeight={900}>
              Results Panel
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Run detection to see results.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <VerdictBanner riskScore={result.risk_score} />

      <RiskScoreCard riskScore={result.risk_score} />

      <Divider />

      <ObfuscationTokensCard
        tokens={result.tokens}
        labels={result.labels}
        scores={result.scores}
        obfTokens={result.obf_tokens}
      />
    </Box>
  );
}
