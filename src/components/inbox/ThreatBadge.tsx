// src/components/inbox/ThreatBadge.tsx
import { Chip, Tooltip } from "@mui/material";
import type { ThreatResult } from "../../services/inboxScanService";

export default function ThreatBadge({ threat }: { threat: ThreatResult }) {
  if (!threat.scanned) {
    return <Chip label="—" size="small"
      sx={{ bgcolor: "#f5f5f5", color: "#9e9e9e", fontWeight: 700, fontSize: 11 }} />;
  }
  const isSpam = threat.verdict === "SPAM";
  return (
    <Tooltip title={threat.scan_summary} arrow>
      <Chip label={threat.verdict} size="small" sx={{
        bgcolor:    isSpam ? "#fdecea" : "#e8f5e9",
        color:      isSpam ? "#c62828" : "#2e7d32",
        fontWeight: 800, fontSize: 11,
        border:     `1px solid ${isSpam ? "#ef9a9a" : "#a5d6a7"}`,
      }} />
    </Tooltip>
  );
}
