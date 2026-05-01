import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

import { getEmails, getGmailEmails } from "../services/emailService";
import { checkAuthStatus } from "../services/gmailAuthService";
import { scanSingleEmail } from "../services/fullEmailScanService";
import { generateSingleEmailThreatReportPdf } from "../services/reportPdfService";

import type { EmailItem } from "../types/email";

type AttachmentItem = {
  filename?: string;
  mimeType?: string;
  attachment_id?: string;
};

type ReportEmailItem = EmailItem & {
  sender_domain?: string;
  date?: string;
  received_at?: string;
  headers?: Record<string, unknown>;
  spf?: string;
  dkim?: string;
  dmarc?: string;
  reply_to?: string;
  attachments?: AttachmentItem[];
};

function getDomain(sender: string): string {
  const match = sender.match(/@([^>\s]+)/);
  return match?.[1] || "";
}

function stripHtml(value: string): string {
  if (!value) return "";

  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Reports() {
  const [emails, setEmails] = useState<ReportEmailItem[]>([]);
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState("");
  const [error, setError] = useState("");
  const [source, setSource] = useState<"gmail" | "demo">("demo");
  const [gmailConnected, setGmailConnected] = useState(false);

  const filteredEmails = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return emails;

    return emails.filter((email) => {
      const sender = stripHtml(email.sender || "").toLowerCase();
      const subject = stripHtml(email.subject || "").toLowerCase();
      const domain = stripHtml(
        email.sender_domain || getDomain(email.sender || "")
      ).toLowerCase();

      return sender.includes(q) || subject.includes(q) || domain.includes(q);
    });
  }, [emails, query]);

  const loadEmails = async () => {
    setLoading(true);
    setError("");

    try {
      let connected = false;

      try {
        connected = await checkAuthStatus();
      } catch {
        connected = false;
      }

      setGmailConnected(connected);

      if (connected) {
        const gmailRes = await getGmailEmails();

        if (gmailRes.connected && Array.isArray(gmailRes.emails)) {
          setEmails(gmailRes.emails as ReportEmailItem[]);
          setSource("gmail");
          return;
        }
      }

      const demoList = (await getEmails()) as ReportEmailItem[];
      setEmails(demoList);
      setSource("demo");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const generateReport = async (email: ReportEmailItem) => {
    if (generatingId) return;

    setGeneratingId(email.id);
    setError("");

    try {
      const result = await scanSingleEmail(email);
      generateSingleEmailThreatReportPdf(email, result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setGeneratingId("");
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 950 }}>
            Email Reports
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Click an email to analyze it and automatically download the PDF report.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={gmailConnected ? "Gmail Connected" : "Demo Emails"}
            color={gmailConnected ? "success" : "warning"}
            sx={{ fontWeight: 800 }}
          />

          <Button
            variant="outlined"
            startIcon={
              loading ? <CircularProgress size={16} /> : <RefreshIcon />
            }
            onClick={loadEmails}
            disabled={loading || !!generatingId}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ pb: 1.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                Loaded Emails
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Source: {source === "gmail" ? "Gmail Inbox" : "Demo Emails"} •{" "}
                {filteredEmails.length} email(s)
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search sender, subject, domain..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: "100%", md: 320 } }}
            />
          </Stack>
        </CardContent>

        <Divider />

        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading emails...
            </Typography>
          </Stack>
        ) : filteredEmails.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 8 }}>
            <EmailOutlinedIcon color="disabled" sx={{ fontSize: 48 }} />
            <Typography variant="body2" color="text.secondary">
              No emails found.
            </Typography>
          </Stack>
        ) : (
          <Box>
            {filteredEmails.map((email) => {
              const domain = email.sender_domain || getDomain(email.sender || "");
              const isGenerating = generatingId === email.id;

              return (
                <Tooltip
                  key={email.id}
                  title="Click to analyze this email and download PDF report"
                  placement="top"
                >
                  <Box
                    onClick={() => generateReport(email)}
                    sx={{
                      px: 2,
                      py: 1.45,
                      cursor: generatingId ? "not-allowed" : "pointer",
                      bgcolor: isGenerating
                        ? "rgba(25, 118, 210, 0.08)"
                        : "white",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      opacity: generatingId && !isGenerating ? 0.55 : 1,
                      pointerEvents: generatingId && !isGenerating ? "none" : "auto",
                      "&:hover": {
                        bgcolor: isGenerating
                          ? "rgba(25, 118, 210, 0.12)"
                          : "rgba(0,0,0,0.03)",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                    >
                      <Box sx={{ width: 34, display: "flex", justifyContent: "center" }}>
                        {isGenerating ? (
                          <CircularProgress size={22} />
                        ) : (
                          <PictureAsPdfIcon color="primary" />
                        )}
                      </Box>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={{ xs: 0.5, md: 2 }}
                          alignItems={{ xs: "flex-start", md: "center" }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 900,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {stripHtml(email.sender || "Unknown sender")}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {stripHtml(domain || "unknown domain")}
                            </Typography>
                          </Box>

                          <Box sx={{ minWidth: 0, flex: 1.5 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 900,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {stripHtml(email.subject || "No subject")}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {isGenerating
                                ? "Analyzing email and preparing PDF..."
                                : "Click to generate threat report"}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              width: { xs: "100%", md: 170 },
                              display: "flex",
                              justifyContent: { xs: "flex-start", md: "flex-end" },
                            }}
                          >
                            <Chip
                              label={isGenerating ? "Generating..." : "Generate Report"}
                              color={isGenerating ? "warning" : "primary"}
                              sx={{ fontWeight: 900 }}
                            />
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
}