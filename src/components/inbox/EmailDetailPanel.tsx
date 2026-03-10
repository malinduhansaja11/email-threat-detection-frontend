// src/components/inbox/EmailDetailPanel.tsx
import {
  Box, Button, Card, CardContent, Chip, Divider,
  LinearProgress, List, ListItem, ListItemIcon,
  ListItemText, Stack, Typography,
} from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import RefreshOutlinedIcon    from "@mui/icons-material/RefreshOutlined";
import WarningAmberIcon       from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import type { ScannedEmail } from "../../services/inboxScanService";

type ColorKey = "success" | "warning" | "error" | "default";
const barColor  = (s: number): ColorKey => s > 60 ? "error" : s > 35 ? "warning" : "success";
const riskColor = (l: string): ColorKey =>
  l === "LOW" ? "success" : l === "MEDIUM" ? "warning" :
  (l === "HIGH" || l === "CRITICAL") ? "error" : "default";

interface Props { email: ScannedEmail; onAnalyze: () => void; onRefresh: () => void; }

export default function EmailDetailPanel({ email, onAnalyze, onRefresh }: Props) {
  const { threat } = email;
  const isSpam = threat.verdict === "SPAM";

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2.5 }}>

        <Typography variant="h6" fontWeight={800} noWrap gutterBottom>
          {email.subject}
        </Typography>
        <Typography variant="body2" color="text.secondary">From: {email.sender}</Typography>
        <Typography variant="caption"  color="text.disabled">{email.received_at}</Typography>

        <Divider sx={{ my: 2 }} />

        {/* Threat verdict block */}
        {threat.scanned && (
          <Box sx={{
            borderRadius: 2, p: 2, mb: 2,
            border: "1px solid",
            borderColor: isSpam ? "error.light" : "success.light",
            bgcolor:     isSpam ? "rgba(211,47,47,0.04)" : "rgba(46,125,50,0.04)",
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Stack direction="row" spacing={1}>
                <Chip label={threat.verdict} color={isSpam ? "error" : "success"}
                  sx={{ fontWeight: 900, fontSize: 13 }} />
                <Chip label={threat.risk_level} variant="outlined" size="small"
                  color={riskColor(threat.risk_level)} sx={{ fontWeight: 700 }} />
              </Stack>
              <Typography variant="h5" fontWeight={900}
                color={isSpam ? "error.main" : "success.main"}>
                {threat.spam_probability}%
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" mb={1.5}>
              {threat.scan_summary}
            </Typography>

            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={700}>Spam Probability</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={threat.spam_probability}
              color={isSpam ? "error" : "success"}
              sx={{ height: 10, borderRadius: 5, mb: 2 }} />

            <Typography variant="caption" fontWeight={800} color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Model Scores
            </Typography>
            {threat.model_scores.map((s) => (
              <Box key={s.name} mt={0.8}>
                <Stack direction="row" justifyContent="space-between" mb={0.3}>
                  <Typography variant="caption" color="text.secondary">{s.name}</Typography>
                  <Typography variant="caption" fontWeight={700}>{s.score}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={s.score}
                  color={barColor(s.score)} sx={{ height: 5, borderRadius: 3 }} />
              </Box>
            ))}
          </Box>
        )}

        {/* Flags */}
        {threat.scanned && (
          <Box mb={2}>
            <Typography variant="caption" fontWeight={800} color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Temporal Flags
            </Typography>
            <List dense disablePadding sx={{ mt: 0.5 }}>
              {threat.temporal_flags.map((f, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.2 }}>
                  <ListItemIcon sx={{ minWidth: 26 }}>
                    {f.startsWith("No suspicious")
                      ? <CheckCircleOutlineIcon color="success" sx={{ fontSize: 15 }} />
                      : <WarningAmberIcon       color="warning" sx={{ fontSize: 15 }} />}
                  </ListItemIcon>
                  <ListItemText primary={f}
                    primaryTypographyProps={{ variant: "caption" }} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="body2" sx={{
          whiteSpace: "pre-wrap", lineHeight: 1.7,
          maxHeight: 160, overflow: "auto", color: "text.secondary",
        }}>
          {email.body}
        </Typography>

        <Stack direction="row" spacing={1} mt={2.5}>
          <Button variant="contained" startIcon={<AssessmentOutlinedIcon />}
            onClick={onAnalyze} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Full Analysis
          </Button>
          <Button variant="outlined" startIcon={<RefreshOutlinedIcon />}
            onClick={onRefresh} sx={{ borderRadius: 2 }}>
            Re-scan
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
