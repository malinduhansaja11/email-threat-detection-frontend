import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Paper,
  Button,
  CircularProgress,

} from "@mui/material";




import { useEffect, useMemo, useState } from "react";

import HeaderSpoofingPanel from "../components/analyzer/HeaderSpoofingPanel.tsx";
import TemporalEvasionPanel from "../components/analyzer/TemporalEvasionPanel.tsx";
import EmailInputCard from "../components/analyzer/EmailInputCard.tsx";
import ResultsPanel from "../components/analyzer/ResultsPanel.tsx";
import HighlightedBody from "../components/analyzer/HighlightedBody.tsx";
import { saveHistory } from "../services/historyService";


import { analyzeEmailBody } from "../services/analyzerService";
import type { AnalyzeResponse } from "../types/analyzer";
import { loadSelectedEmail, clearSelectedEmail } from "../services/selectedEmail";

// Icons (MUI)
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HdrStrongOutlinedIcon from "@mui/icons-material/HdrStrongOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

type AnalyzerSection = "obfuscation" | "header" | "time" | "phishingLinks";

const SECTION_META: Record<
  AnalyzerSection,
  { title: string; desc: string; icon: React.ReactNode; badge: string }
> = {
  obfuscation: {
    title: "Obfuscation Analyzer",
    desc: "Detect hidden characters, encoding tricks and suspicious patterns in the body.",
    icon: <VisibilityOutlinedIcon />,
    badge: "Body",
  },
  header: {
    title: "Header Analyzer",
    desc: "Inspect mail headers to detect spoofing, sender anomalies and routing issues.",
    icon: <HdrStrongOutlinedIcon />,
    badge: "Header",
  },
  time: {
    title: "Time-based Analyzer",
    desc: "Analyze time patterns to identify unusual send-time behavior or automation.",
    icon: <ScheduleOutlinedIcon />,
    badge: "Timing",
  },
  phishingLinks: {
    title: "URL Analyzer",
    desc: "Extract and score links for risky domains, redirects and phishing indicators.",
    icon: <LinkOutlinedIcon />,
    badge: "Links",
  },
};

type HeaderSpoofingPanelProps = {
  headers?: Record<string, string>;
  sender?: string;
  subject?: string;
  body?: string;
  replyTo?: string;
  dkim?: string;
  spf?: string;
  dmarc?: string;
};

// ── colour helper ─────────────────────────────────────────────────────────────
function actionColor(action: string) {
  if (action === "BLOCK") return "#C62828";
  if (action === "QUARANTINE") return "#E65100";
  if (action === "WARN") return "#F9A825";
  if (action === "ALLOW") return "#2E7D32";
  return "#555";
}

// ── extract URLs from plain text ──────────────────────────────────────────────
function extractURLs(text: string): string[] {
  const regex = /https?:\/\/[^\s<>"{}|\\^[\]]+|www\.[^\s<>"{}|\\^[\]]+/gi;
  return [...new Set(text.match(regex) ?? [])];
}

function SectionCard({
  title,
  desc,
  badge,
  icon,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  badge: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: active ? "primary.main" : "divider",
        overflow: "hidden",
        transition: "all .2s ease",
        background:
          active
            ? "linear-gradient(135deg, rgba(25,118,210,0.10), rgba(25,118,210,0.02))"
            : "linear-gradient(135deg, rgba(0,0,0,0.02), rgba(0,0,0,0.00))",
        boxShadow: active ? "0 12px 30px rgba(25,118,210,0.16)" : "none",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "primary.main",
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 2.2 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                border: "1px solid",
                borderColor: active ? "primary.main" : "divider",
                backgroundColor: active ? "rgba(25,118,210,0.10)" : "background.paper",
              }}
            >
              {icon}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  {title}
                </Typography>
                <Chip
                  size="small"
                  label={badge}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    bgcolor: active ? "primary.main" : "action.hover",
                    color: active ? "primary.contrastText" : "text.secondary",
                  }}
                />
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                {desc}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ── URL Analyzer Panel ────────────────────────────────────────────────────────
function URLAnalyzerPanel({
  emailBody,
  selectedEmail,
}: {
  emailBody: string;
  selectedEmail: any;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [verdict, setVerdict] = useState<string>("");
  const [manualUrl, setManualUrl] = useState("");
  const [error, setError] = useState("");

  // Auto-extract URLs whenever email body changes
  useEffect(() => {
    if (emailBody.trim()) {
      const found = extractURLs(emailBody);
      setUrls(found);
      setResults([]);
      setVerdict("");
    }
  }, [emailBody]);

  // Scan ALL extracted URLs via /api/url/scan-email
  const scanAll = async () => {
    if (!emailBody.trim()) return;
    setScanning(true);
    setError("");
    setResults([]);
    setVerdict("");
    try {
      const res = await fetch("/api/url/scan-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_body: emailBody }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setVerdict(data.verdict ?? "");

      await saveHistory({
        type: "phishingLinks",
        source: selectedEmail ? "gmail" : "demo",
        sender: selectedEmail?.sender,
        subject: selectedEmail?.subject ?? "URL Scan",
        url_count: data.results?.length || 0,
        url_verdict: data.verdict || "unknown",
      });
    } catch {
      setError("❌ Could not reach backend. Make sure uvicorn is running on port 8000.");
    } finally {
      setScanning(false);
    }
  };

  // Scan a single manually typed URL
  const scanManual = async () => {
    if (!manualUrl.trim()) return;
    setScanning(true);
    setError("");
    try {
      const res = await fetch("/api/url/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualUrl }),
      });
      const data = await res.json();
      setResults([data]);
      setVerdict(data.action ?? "");

      await saveHistory({
        type: "phishingLinks",
        source: selectedEmail ? "gmail" : "demo",
        sender: selectedEmail?.sender,
        subject: selectedEmail?.subject ?? "Manual URL Scan",
        url_count: 1,
        url_verdict: data.action || "unknown",
      });
    } catch {
      setError("❌ Could not reach backend. Make sure uvicorn is running on port 8000.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

      {/* ── Step 1: Email body loaded indicator ── */}
      <Paper
        elevation={0}
        sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
      >
        <Typography variant="subtitle1" fontWeight={800} gutterBottom>
          Step 1 — Email Body
        </Typography>
        {emailBody.trim() ? (
          <Box sx={{ p: 1.5, bgcolor: "#E8F5E9", borderRadius: 2, border: "1px solid #A5D6A7" }}>
            <Typography variant="body2" color="#2E7D32" fontWeight={700}>
              ✅ Email loaded — {emailBody.length} characters
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                fontFamily: "monospace",
                fontSize: 11,
                maxHeight: 60,
                overflow: "hidden",
              }}
            >
              {emailBody.slice(0, 200)}...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1.5, bgcolor: "#FFF8E1", borderRadius: 2, border: "1px solid #FFE082" }}>
            <Typography variant="body2" color="#E65100" fontWeight={700}>
              ⚠ No email loaded. Go to Inbox, select an email and click Analyze.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ── Step 2: Extracted URLs ── */}
      <Paper
        elevation={0}
        sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
      >
        <Typography variant="subtitle1" fontWeight={800} gutterBottom>
          Step 2 — URLs Found in Email
        </Typography>

        {urls.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emailBody.trim()
              ? "No URLs detected in this email."
              : "Load an email first to extract URLs."}
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
            {urls.map((u, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  bgcolor: "action.hover",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    flex: 1,
                    wordBreak: "break-all",
                    color: "#1A3A5C",
                  }}
                >
                  🔗 {u}
                </Typography>
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {urls.length} URL{urls.length !== 1 ? "s" : ""} found
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ── Step 3: Scan button ── */}
      <Paper
        elevation={0}
        sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
      >
        <Typography variant="subtitle1" fontWeight={800} gutterBottom>
          Step 3 — Scan URLs
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            onClick={scanAll}
            disabled={scanning || urls.length === 0}
            startIcon={scanning ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: "#1A3A5C", "&:hover": { bgcolor: "#0d2137" } }}
          >
            {scanning
              ? "Scanning..."
              : `🔍 Scan All ${urls.length} URL${urls.length !== 1 ? "s" : ""}`}
          </Button>

          {/* Manual URL input */}
          <Box sx={{ display: "flex", gap: 1, flex: 1, minWidth: 280 }}>
            <input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scanManual()}
              placeholder="Or type a URL manually..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "13px",
              }}
            />
            <Button
              variant="outlined"
              onClick={scanManual}
              disabled={scanning || !manualUrl.trim()}
            >
              Scan
            </Button>
          </Box>
        </Stack>

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {/* ── Step 4: Results ── */}
      {results.length > 0 && (
        <Paper
          elevation={0}
          sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Step 4 — Scan Results
            </Typography>
            {verdict && (
              <Chip
                label={`Overall: ${verdict}`}
                sx={{
                  fontWeight: 800,
                  bgcolor: actionColor(verdict),
                  color: "#fff",
                  borderRadius: 2,
                }}
              />
            )}
          </Stack>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {results.map((r: any, i: number) => (
              <Box
                key={i}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: actionColor(r.action ?? r.verdict ?? "ALLOW"),
                  bgcolor: "#fafafa",
                }}
              >
                {/* URL */}
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    wordBreak: "break-all",
                    color: "#333",
                    mb: 1,
                  }}
                >
                  🔗 {r.original_url ?? manualUrl}
                </Typography>

                {/* Action badge + scores */}
                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                  <Chip
                    label={r.action ?? r.verdict}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      bgcolor: actionColor(r.action ?? r.verdict ?? ""),
                      color: "#fff",
                      borderRadius: 2,
                    }}
                  />
                  <Typography variant="body2">
                    <strong>Score:</strong> {r.suspicion_score ?? "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>ML:</strong> {r.ml_prediction ?? "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Hops:</strong> {r.trace?.total_hops ?? "N/A"}
                  </Typography>
                </Stack>

                {/* Reasons */}
                {r.reasons && r.reasons.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      WHY:
                    </Typography>
                    {r.reasons.map((reason: string, j: number) => (
                      <Typography
                        key={j}
                        variant="caption"
                        display="block"
                        sx={{ ml: 1, color: "#555" }}
                      >
                        • {reason}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default function Analyzer() {
  const [activeSection, setActiveSection] = useState<AnalyzerSection>("obfuscation");

  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  // ADD THESE 5 NEW LINES directly below:
  const [urlList, setUrlList] = useState<string[]>([]);
  const [urlResults, setUrlResults] = useState<any[]>([]);
  const [urlVerdict, setUrlVerdict] = useState("");
  const [urlScanning, setUrlScanning] = useState(false);
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    const savedEmail = loadSelectedEmail();
    if (savedEmail) {
      setSelectedEmail(savedEmail);
      setBody(savedEmail.body || "");
      clearSelectedEmail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const onAnalyze = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await analyzeEmailBody(body);
  //     setResult(res);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onAnalyze = async () => {
    try {
      const data = await analyzeEmailBody(body);
      setResult(data);

      // ✅ Save to Firebase History
      await saveHistory({
        type: "obfuscation",
        source: selectedEmail ? "gmail" : "demo",
        sender: selectedEmail?.sender ?? "manual",
        subject: selectedEmail?.subject ?? "Manual Analyze",
        risk_score: data.risk_score,
        obf_tokens: data.obf_tokens,
      });

    } catch (err) {
      console.error(err);
    }
  };


  const scanAllUrls = async () => {
    if (!body.trim()) return;
    setUrlScanning(true); setUrlError(""); setUrlResults([]); setUrlVerdict("");
    try {
      const res = await fetch("/api/url/scan-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_body: body }),
      });
      const data = await res.json();
      setUrlResults(data.results ?? []);
      setUrlVerdict(data.verdict ?? "");
    } catch {
      setUrlError("Cannot reach backend. Is uvicorn running on port 8000?");
    } finally {
      setUrlScanning(false);
    }
  };


  const section = useMemo(() => SECTION_META[activeSection], [activeSection]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: { xs: 1, md: 2 },
      }}
    >
      {/* Top Header */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          p: { xs: 2, md: 2.5 },
          background:
            "linear-gradient(135deg, rgba(25,118,210,0.08), rgba(255,255,255,0.0))",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <VerifiedOutlinedIcon />
              <Typography variant="h5" fontWeight={900}>
                Email Security Analyzer
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Choose a module and analyze suspicious content with clear evidence and highlights.
            </Typography>
          </Box>

          <Chip
            label={`Active: ${section.title}`}
            sx={{
              borderRadius: 3,
              fontWeight: 800,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              px: 1,
            }}
          />
        </Stack>
      </Paper>

      {/* Section Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {(
          Object.keys(SECTION_META) as Array<AnalyzerSection>
        ).map((key) => (
          <SectionCard
            key={key}
            title={SECTION_META[key].title}
            desc={SECTION_META[key].desc}
            icon={SECTION_META[key].icon}
            badge={SECTION_META[key].badge}
            active={activeSection === key}
            onClick={() => setActiveSection(key)}
          />
        ))}
      </Box>

      <Divider sx={{ opacity: 0.7 }} />

      {/* Section Content */}
      {activeSection === "obfuscation" && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 380px" },
            gap: 2,
            alignItems: "start",
          }}
        >
          {/* Left */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <EmailInputCard body={body} setBody={setBody} onAnalyze={onAnalyze} loading={loading} />
            <HighlightedBody result={result} />
          </Box>

          {/* Right (sticky on desktop) */}
          <Box
            sx={{
              position: { lg: "sticky" },
              top: { lg: 16 },
              alignSelf: "start",
            }}
          >
            <ResultsPanel result={result} />
          </Box>
        </Box>
      )}

       {activeSection === "time" && <TemporalEvasionPanel selectedEmail={selectedEmail} />}

      {/* Other sections - placeholders with better UI */}



      {/* {activeSection !== "obfuscation" && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 2, md: 3 },
          }}
        >
          <Typography variant="h6" fontWeight={900}>
            {section.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {section.desc}
          </Typography>

          <Box
            sx={{
              mt: 2,
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "divider",
              p: 2,
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="subtitle2" fontWeight={800}>
              Coming Next
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Connect the API + UI components for this module here (same layout pattern as Obfuscation).
            </Typography>
          </Box>
        </Paper>
      )} */}

      {/* ── URL Analyzer section — YOUR MODULE ── */}
      {activeSection === "phishingLinks" && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 2, md: 3 },
          }}
        >
          <Typography variant="h6" fontWeight={900}>
            URL Analyzer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Extract and score links for risky domains, redirects and phishing indicators.
          </Typography>
          <URLAnalyzerPanel emailBody={body} selectedEmail={selectedEmail} />
        </Paper>
      )}


      {(activeSection === "header" || activeSection === "time") && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 2, md: 3 },
          }}
        >
          <Typography variant="h6" fontWeight={900}>
            {section.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {section.desc}
          </Typography>
          <Box
            sx={{
              mt: 2,
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "divider",
              p: 2,
              bgcolor: "action.hover",
            }}
          >
{activeSection === "header" && selectedEmail?.headers && (
  <>
    <HeaderSpoofingPanel
      headers={selectedEmail.headers}
      sender={selectedEmail.sender}
      subject={selectedEmail.subject}
      body={selectedEmail.body}
      replyTo={selectedEmail.headers?.["Reply-To"]}
      dkim={selectedEmail.dkim}
      spf={selectedEmail.spf}
      dmarc={selectedEmail.dmarc}
    />

    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip
          size="small"
          label={`SPF: ${selectedEmail.spf || "unknown"}`}
          color={
            selectedEmail.spf === "pass"
              ? "success"
              : selectedEmail.spf === "fail"
              ? "error"
              : "warning"
          }
        />
        <Chip
          size="small"
          label={`DKIM: ${selectedEmail.dkim || "unknown"}`}
          color={
            selectedEmail.dkim === "pass"
              ? "success"
              : selectedEmail.dkim === "fail"
              ? "error"
              : "warning"
          }
        />
        <Chip
          size="small"
          label={`DMARC: ${selectedEmail.dmarc || "unknown"}`}
          color={
            selectedEmail.dmarc === "pass"
              ? "success"
              : selectedEmail.dmarc === "fail"
              ? "error"
              : "warning"
          }
        />
      </Stack>

      {["From", "To", "Reply-To", "Return-Path", "Subject", "Date", "Message-ID", "Authentication-Results", "Received"].map((key) =>
        selectedEmail.headers[key] ? (
          <Box key={key}>
            <Typography>{key}</Typography>
            <Typography>{selectedEmail.headers[key]}</Typography>
          </Box>
        ) : null
      )}
    </Box>
  </>
)}

            {activeSection === "header" ? (
              selectedEmail && selectedEmail.headers ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      size="small"
                      label={`SPF: ${selectedEmail.spf || "unknown"}`}
                      color={
                        selectedEmail.spf === "pass"
                          ? "success"
                          : selectedEmail.spf === "fail"
                            ? "error"
                            : "warning"
                      }
                    />
                    <Chip
                      size="small"
                      label={`DKIM: ${selectedEmail.dkim || "unknown"}`}
                      color={
                        selectedEmail.dkim === "pass"
                          ? "success"
                          : selectedEmail.dkim === "fail"
                            ? "error"
                            : "warning"
                      }
                    />
                    <Chip
                      size="small"
                      label={`DMARC: ${selectedEmail.dmarc || "unknown"}`}
                      color={
                        selectedEmail.dmarc === "pass"
                          ? "success"
                          : selectedEmail.dmarc === "fail"
                            ? "error"
                            : "warning"
                      }
                    />
                  </Stack>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Sender:</strong> {selectedEmail.sender || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Subject:</strong> {selectedEmail.subject || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {selectedEmail.date || selectedEmail.received_at || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Sender Domain:</strong> {selectedEmail.sender_domain || "—"}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {[
                      "From",
                      "To",
                      "Reply-To",
                      "Return-Path",
                      "Subject",
                      "Date",
                      "Message-ID",
                      "Authentication-Results",
                      "Received",
                    ].map((key) =>
                      selectedEmail.headers[key] ? (
                        <Box
                          key={key}
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} color="primary.main">
                            {key}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace", wordBreak: "break-word" }}
                          >
                            {selectedEmail.headers[key]}
                          </Typography>
                        </Box>
                      ) : null
                    )}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No headers found for this email.
                </Typography>
              )
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    Email Summary
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Sender:</strong> {selectedEmail?.sender || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Subject:</strong> {selectedEmail?.subject || "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {selectedEmail?.date || selectedEmail?.received_at || "—"}
                    </Typography>
                  </Box>
                </Box>
                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    Email Body
                  </Typography>

                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      maxHeight: 220,
                      overflow: "auto",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        lineHeight: 1.7,
                      }}
                    >
                      {body || "No email body found."}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    Important Headers
                  </Typography>

                  {selectedEmail?.headers ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {[
                        "From",
                        "To",
                        "Reply-To",
                        "Return-Path",
                        "Subject",
                        "Date",
                        "Message-ID",
                        "Authentication-Results",
                        "Received",
                      ].map((key) =>
                        selectedEmail.headers[key] ? (
                          <Box
                            key={key}
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: "background.paper",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Typography variant="caption" fontWeight={700} color="primary.main">
                              {key}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                wordBreak: "break-word",
                              }}
                            >
                              {selectedEmail.headers[key]}
                            </Typography>
                          </Box>
                        ) : null
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No headers found for this email.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>




  );
}



