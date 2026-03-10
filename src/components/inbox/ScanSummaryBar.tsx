// src/components/inbox/ScanSummaryBar.tsx
import { Box, Chip, Stack, Typography } from "@mui/material";
import ShieldOutlinedIcon     from "@mui/icons-material/ShieldOutlined";
import ErrorOutlineIcon       from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon       from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import type { ScanResult } from "../../services/inboxScanService";

export default function ScanSummaryBar({ result }: { result: ScanResult }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", flexWrap: "wrap",
      gap: 1.5, px: 2.5, py: 1.5,
      bgcolor: "rgba(25,118,210,0.04)",
      border: "1px solid", borderColor: "divider", borderRadius: 2,
    }}>
      <ShieldOutlinedIcon fontSize="small" color="primary" />
      <Typography variant="body2" fontWeight={800} mr={0.5}>Scan Results</Typography>

      <Chip icon={<ShieldOutlinedIcon fontSize="small" />}
        label={`${result.total} scanned`} size="small"
        sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 700 }} />

      <Chip icon={<ErrorOutlineIcon fontSize="small" />}
        label={`${result.spam_count} SPAM`} size="small"
        sx={{ bgcolor: result.spam_count > 0 ? "#fdecea" : "#f5f5f5",
             color:   result.spam_count > 0 ? "#c62828" : "#9e9e9e", fontWeight: 700 }} />

      <Chip icon={<CheckCircleOutlineIcon fontSize="small" />}
        label={`${result.ham_count} HAM`} size="small"
        sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }} />

      <Chip icon={<WarningAmberIcon fontSize="small" />}
        label={`${result.high_risk} High/Critical`} size="small"
        sx={{ bgcolor: result.high_risk > 0 ? "#fff3e0" : "#f5f5f5",
             color:   result.high_risk > 0 ? "#e65100" : "#9e9e9e", fontWeight: 700 }} />

      <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
        Source: {result.source === "gmail" ? "Gmail" : "Demo"} · GlobalTemporalEvasion-v1
      </Typography>
    </Box>
  );
}
