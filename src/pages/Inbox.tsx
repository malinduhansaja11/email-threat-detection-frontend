import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import TuneIcon from "@mui/icons-material/Tune";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SortIcon from "@mui/icons-material/Sort";
import { useNavigate } from "react-router-dom";

import {
  connectGmail,
  disconnectGmail,
  checkAuthStatus,
} from "../services/gmailAuthService";
import { getEmails, seedEmails, getGmailEmails } from "../services/emailService";
import type { EmailItem } from "../types/email";
import { saveSelectedEmail } from "../services/selectedEmail";
import { fetchScannedInbox } from "../services/inboxScanService";
import type { ScanResult, ThreatResult } from "../services/inboxScanService";
import ThreatBadge from "../components/inbox/ThreatBadge";
import ScanSummaryBar from "../components/inbox/ScanSummaryBar";

type AttachmentItem = {
  filename: string;
  mimeType?: string;
  attachment_id?: string;
};

type GmailEmailItem = EmailItem & {
  sender_domain?: string;
  date?: string;
  received_at?: string;
  headers?: Record<string, string>;
  spf?: string;
  dkim?: string;
  dmarc?: string;
  attachments?: AttachmentItem[];
  threat?: ThreatResult;
};

let INBOX_MEM_CACHE: {
  emails: GmailEmailItem[] | null;
  selectedEmailId: string | null;
  source: "gmail" | "demo" | null;
  gmailConnected: boolean;
  scanResult: ScanResult | null;
} = {
  emails: null,
  selectedEmailId: null,
  source: null,
  gmailConnected: false,
  scanResult: null,
};

const RISK_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  UNKNOWN: 4,
  SAFE: 5,
};

type ChipColor = "success" | "warning" | "error" | "default";

const riskChipColor = (l: string): ChipColor =>
  l === "LOW" || l === "SAFE"
    ? "success"
    : l === "MEDIUM"
    ? "warning"
    : l === "HIGH" || l === "CRITICAL"
    ? "error"
    : "default";

function AuthChip({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  const normalized = (value || "unknown").toLowerCase();

  let color: "success" | "error" | "default" | "warning" = "default";
  if (normalized === "pass") color = "success";
  else if (normalized === "fail") color = "error";
  else if (normalized === "unknown") color = "warning";

  return (
    <Chip
      size="small"
      label={`${label}: ${value || "unknown"}`}
      color={color}
    />
  );
}

export default function Inbox() {
  const navigate = useNavigate();

  const [emails, setEmails] = useState<GmailEmailItem[]>(
    INBOX_MEM_CACHE.emails ?? []
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    INBOX_MEM_CACHE.selectedEmailId ? [INBOX_MEM_CACHE.selectedEmailId] : []
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHeaders, setShowHeaders] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(
    INBOX_MEM_CACHE.gmailConnected
  );
  const [scanResult, setScanResult] = useState<ScanResult | null>(
    INBOX_MEM_CACHE.scanResult
  );
  const [sortByRisk, setSortByRisk] = useState(false);

  const [selectedEmail, setSelectedEmail] = useState<GmailEmailItem | null>(
    () => {
      if (!INBOX_MEM_CACHE.emails?.length) return null;
      const found = INBOX_MEM_CACHE.selectedEmailId
        ? INBOX_MEM_CACHE.emails.find(
            (e) => e.id === INBOX_MEM_CACHE.selectedEmailId
          )
        : null;
      return found ?? INBOX_MEM_CACHE.emails[0];
    }
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = q
      ? emails.filter((e) => {
          const headerText = e.headers
            ? Object.entries(e.headers)
                .map(([k, v]) => `${k} ${v}`)
                .join(" ")
            : "";

          return (
            (e.subject || "").toLowerCase().includes(q) ||
            (e.sender || "").toLowerCase().includes(q) ||
            (e.body || "").toLowerCase().includes(q) ||
            (e.sender_domain || "").toLowerCase().includes(q) ||
            headerText.toLowerCase().includes(q)
          );
        })
      : [...emails];

    if (sortByRisk) {
      list.sort(
        (a, b) =>
          (RISK_ORDER[a.threat?.risk_level ?? "UNKNOWN"] ?? 9) -
          (RISK_ORDER[b.threat?.risk_level ?? "UNKNOWN"] ?? 9)
      );
    }

    return list;
  }, [emails, query, sortByRisk]);

  const allChecked =
    filtered.length > 0 && selectedIds.length === filtered.length;

  const toggleAll = () => {
    if (allChecked) setSelectedIds([]);
    else setSelectedIds(filtered.map((e) => e.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyList = (
    list: GmailEmailItem[],
    source: "gmail" | "demo",
    connected = false
  ) => {
    setEmails(list);
    INBOX_MEM_CACHE.emails = list;
    INBOX_MEM_CACHE.source = source;

    setGmailConnected(connected);
    INBOX_MEM_CACHE.gmailConnected = connected;

    const preferId = INBOX_MEM_CACHE.selectedEmailId;
    const nextSelected =
      (preferId ? list.find((e) => e.id === preferId) : null) ??
      (list.length ? list[0] : null);

    setSelectedEmail(nextSelected);
  };

  const load = async (force = false) => {
    if (!force && INBOX_MEM_CACHE.emails && INBOX_MEM_CACHE.emails.length > 0) {
      setEmails(INBOX_MEM_CACHE.emails);
      setGmailConnected(INBOX_MEM_CACHE.gmailConnected);
      setScanResult(INBOX_MEM_CACHE.scanResult);

      const preferId = INBOX_MEM_CACHE.selectedEmailId;
      const nextSelected =
        (preferId
          ? INBOX_MEM_CACHE.emails.find((e) => e.id === preferId)
          : null) ??
        INBOX_MEM_CACHE.emails[0] ??
        null;

      setSelectedEmail(nextSelected);
      return;
    }

    setLoading(true);
    setError("");

    try {
      try {
        const isConnected = await checkAuthStatus();
        setGmailConnected(isConnected);
        INBOX_MEM_CACHE.gmailConnected = isConnected;
      } catch {
        // ignore
      }

      const [gmailRes, scanned] = await Promise.allSettled([
        getGmailEmails(),
        fetchScannedInbox(),
      ]);

      const threatMap: Record<string, ThreatResult> = {};

      if (scanned.status === "fulfilled") {
        const sr = scanned.value;
        setScanResult(sr);
        INBOX_MEM_CACHE.scanResult = sr;

        for (const e of sr.emails) {
          threatMap[e.id] = e.threat;
        }
      }

      const mergeThreat = (list: GmailEmailItem[]): GmailEmailItem[] =>
        list.map((e) => (threatMap[e.id] ? { ...e, threat: threatMap[e.id] } : e));

      if (
        gmailRes.status === "fulfilled" &&
        gmailRes.value &&
        Array.isArray(gmailRes.value.emails)
      ) {
        const merged = mergeThreat(gmailRes.value.emails as GmailEmailItem[]);
        applyList(
          merged,
          gmailRes.value.connected ? "gmail" : "demo",
          !!gmailRes.value.connected
        );

        if (gmailRes.value.connected) return;
      }

      const demoList = await getEmails();
      applyList(mergeThreat(demoList as GmailEmailItem[]), "demo", false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSeed = async () => {
    setLoading(true);
    try {
      await seedEmails();
      await load(true);
    } finally {
      setLoading(false);
    }
  };

  const onAnalyze = () => {
    if (!selectedEmail) return;
    saveSelectedEmail(selectedEmail);
    navigate("/analyzer");
  };

  const onToggleGmail = async () => {
    if (loading) return;

    if (gmailConnected) {
      setLoading(true);
      try {
        await disconnectGmail();

        let isConnected = false;
        try {
          isConnected = await checkAuthStatus();
        } catch {
          isConnected = false;
        }

        setGmailConnected(isConnected);
        INBOX_MEM_CACHE.gmailConnected = isConnected;

        if (!isConnected) {
          INBOX_MEM_CACHE.emails = null;
          INBOX_MEM_CACHE.selectedEmailId = null;
          INBOX_MEM_CACHE.source = "demo";
          await load(true);
        }
      } finally {
        setLoading(false);
      }
    } else {
      connectGmail();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Top bar */}
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Inbox
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            onClick={() => load(true)}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <ShieldOutlinedIcon />
              )
            }
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            {loading ? "Detecting..." : "Detect"}
          </Button>

          <Button
            variant="contained"
            onClick={onToggleGmail}
            disabled={loading}
            title={gmailConnected ? "Click to disconnect" : "Click to connect"}
            sx={{
              bgcolor: gmailConnected ? "#2e7d32" : "#d32f2f",
              color: "#fff",
              fontWeight: 700,
              textTransform: "uppercase",
              "&:hover": { bgcolor: gmailConnected ? "#1b5e20" : "#b71c1c" },
              "&.Mui-disabled": {
                bgcolor: gmailConnected ? "#2e7d32" : "#d32f2f",
                color: "#fff",
                opacity: 1,
              },
            }}
          >
            {gmailConnected ? "CONNECTED" : "Connect email account"}
          </Button>
        </Stack>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Scan summary bar */}
      {scanResult && <ScanSummaryBar result={scanResult} />}

      {/* Main 2-column layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 560px",
          gap: 2,
        }}
      >
        {/* Left column */}
        <Card>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              placeholder="Search emails, sender, body, domain, headers"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <IconButton onClick={() => load(true)} title="Refresh">
              <RefreshIcon />
            </IconButton>

            <Tooltip
              title={sortByRisk ? "Sorted by risk — click to reset" : "Sort by risk level"}
            >
              <Button
                size="small"
                variant={sortByRisk ? "contained" : "outlined"}
                startIcon={<SortIcon />}
                onClick={() => setSortByRisk((v) => !v)}
                sx={{ whiteSpace: "nowrap", borderRadius: 2, fontWeight: 700 }}
              >
                Risk Sort
              </Button>
            </Tooltip>

            <IconButton title="Filters">
              <TuneIcon />
            </IconButton>

            <Button variant="outlined" onClick={onSeed} disabled={loading}>
              {loading ? "Seeding..." : "Seed Demo"}
            </Button>
          </CardContent>

          <Divider />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1 }}>
            <Checkbox checked={allChecked} onChange={toggleAll} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {filtered.length} Emails
            </Typography>

            <Typography variant="body2" sx={{ ml: "auto", opacity: 0.7 }}>
              {INBOX_MEM_CACHE.source === "gmail" ? "Source: Gmail" : "Source: Demo"}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ px: 2, py: 1 }}>
            {loading && (
              <Typography
                variant="body2"
                sx={{ opacity: 0.7, textAlign: "center", width: "100%", py: 2 }}
              >
                Loading emails...
              </Typography>
            )}

            {filtered.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                No messages here. Click <b>Seed Demo</b> or connect Gmail.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {filtered.map((e) => (
                  <Box
                    key={e.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "40px 200px 1fr 90px 90px",
                      gap: 1,
                      alignItems: "center",
                      py: 1,
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      cursor: "pointer",
                      bgcolor:
                        selectedEmail?.id === e.id
                          ? "rgba(25,118,210,0.07)"
                          : e.threat?.verdict === "SPAM"
                          ? "rgba(211,47,47,0.03)"
                          : "transparent",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                      transition: "background .15s",
                    }}
                    onClick={() => {
                      setSelectedEmail(e);
                      INBOX_MEM_CACHE.selectedEmailId = e.id;
                    }}
                  >
                    <Checkbox
                      checked={selectedIds.includes(e.id)}
                      onChange={(ev) => {
                        ev.stopPropagation();
                        toggleOne(e.id);
                      }}
                    />

                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {e.sender}
                      </Typography>
                      {e.sender_domain && (
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {e.sender_domain}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="body2" noWrap>
                      <b>{e.subject}</b>{" "}
                      <span style={{ opacity: 0.75 }}>
                        — {(e.body || "").slice(0, 55)}
                        {(e.body || "").length > 55 ? "..." : ""}
                      </span>
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {e.threat ? (
                        <ThreatBadge threat={e.threat} />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {e.threat?.scanned ? (
                        <Chip
                          label={e.threat.risk_level}
                          size="small"
                          color={riskChipColor(e.threat.risk_level)}
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: 10, height: 22 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Card>

        {/* Right column */}
        <Card>
          <CardContent>
            {!selectedEmail ? (
              <Typography variant="body2">Select an email to preview.</Typography>
            ) : (
              <>
                <Typography variant="h6">{selectedEmail.subject}</Typography>

                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  From: {selectedEmail.sender}
                </Typography>

                {selectedEmail.sender_domain && (
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                    Sender Domain: {selectedEmail.sender_domain}
                  </Typography>
                )}

                {(selectedEmail.date || selectedEmail.received_at) && (
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                    Date: {selectedEmail.date || selectedEmail.received_at}
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                  <AuthChip label="SPF" value={selectedEmail.spf} />
                  <AuthChip label="DKIM" value={selectedEmail.dkim} />
                  <AuthChip label="DMARC" value={selectedEmail.dmarc} />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Body
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
                >
                  {selectedEmail.body || "(No body found)"}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Attachments
                </Typography>

                {selectedEmail.attachments && selectedEmail.attachments.length > 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {selectedEmail.attachments.map((att, idx) => (
                      <Box
                        key={`${att.filename}-${idx}`}
                        sx={{
                          px: 1.5,
                          py: 1,
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {att.filename}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.75 }}>
                          {att.mimeType || "unknown type"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    No attachments
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2">Headers</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowHeaders((v) => !v)}
                  >
                    {showHeaders ? "Hide Headers" : "Show Headers"}
                  </Button>
                </Box>

                {showHeaders && (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "#111",
                      color: "#eee",
                      maxHeight: 260,
                      overflow: "auto",
                      fontFamily: "monospace",
                      fontSize: 12,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedEmail.headers &&
                    Object.keys(selectedEmail.headers).length > 0
                      ? Object.entries(selectedEmail.headers)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join("\n")
                      : "No headers found"}
                  </Box>
                )}

                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Button variant="contained" onClick={onAnalyze}>
                    Analyze
                  </Button>
                  <Button variant="outlined" onClick={() => load(true)}>
                    Refresh
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}