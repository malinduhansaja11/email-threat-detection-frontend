import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import TuneIcon from "@mui/icons-material/Tune";
import { useNavigate } from "react-router-dom";

import {
  connectGmail,
  disconnectGmail,
  checkAuthStatus,
} from "../services/gmailAuthService";
import { getEmails, seedEmails, getGmailEmails } from "../services/emailService";
import type { EmailItem } from "../types/email";
import { saveSelectedEmailBody } from "../services/selectedEmail";

/** ✅ in-memory cache (so Analyzer → Inbox back = instant, no delay) */
let INBOX_MEM_CACHE: {
  emails: EmailItem[] | null;
  selectedEmailId: string | null;
  source: "gmail" | "demo" | null;
  gmailConnected: boolean;
} = {
  emails: null,
  selectedEmailId: null,
  source: null,
  gmailConnected: false,
};

export default function Inbox() {
  const navigate = useNavigate();

  const [emails, setEmails] = useState<EmailItem[]>(INBOX_MEM_CACHE.emails ?? []);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    INBOX_MEM_CACHE.selectedEmailId ? [INBOX_MEM_CACHE.selectedEmailId] : []
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Gmail connected state (controls button color + text)
  const [gmailConnected, setGmailConnected] = useState(INBOX_MEM_CACHE.gmailConnected);

  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(() => {
    if (!INBOX_MEM_CACHE.emails?.length) return null;
    const found = INBOX_MEM_CACHE.selectedEmailId
      ? INBOX_MEM_CACHE.emails.find((e) => e.id === INBOX_MEM_CACHE.selectedEmailId)
      : null;
    return found ?? INBOX_MEM_CACHE.emails[0];
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return emails;
    return emails.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.sender.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q)
    );
  }, [emails, query]);

  const allChecked = filtered.length > 0 && selectedIds.length === filtered.length;

  const toggleAll = () => {
    if (allChecked) setSelectedIds([]);
    else setSelectedIds(filtered.map((e) => e.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const applyList = (list: EmailItem[], source: "gmail" | "demo", connected = false) => {
    setEmails(list);
    INBOX_MEM_CACHE.emails = list;
    INBOX_MEM_CACHE.source = source;

    setGmailConnected(connected);
    INBOX_MEM_CACHE.gmailConnected = connected;

    // keep selection stable
    const preferId = INBOX_MEM_CACHE.selectedEmailId;
    const nextSelected =
      (preferId ? list.find((e) => e.id === preferId) : null) ?? (list.length ? list[0] : null);

    setSelectedEmail(nextSelected);
  };

  const load = async (force = false) => {
    // ✅ if cache exists and not forcing refresh → instant
    if (!force && INBOX_MEM_CACHE.emails && INBOX_MEM_CACHE.emails.length > 0) {
      setEmails(INBOX_MEM_CACHE.emails);
      setGmailConnected(INBOX_MEM_CACHE.gmailConnected);

      const preferId = INBOX_MEM_CACHE.selectedEmailId;
      const nextSelected =
        (preferId ? INBOX_MEM_CACHE.emails.find((e) => e.id === preferId) : null) ??
        INBOX_MEM_CACHE.emails[0] ??
        null;

      setSelectedEmail(nextSelected);
      return;
    }

    setLoading(true);
    try {
      // ✅ sync connection status from backend
      try {
        const isConnected = await checkAuthStatus();
        setGmailConnected(isConnected);
        INBOX_MEM_CACHE.gmailConnected = isConnected;
      } catch {
        // ignore
      }

      // ✅ try Gmail first
      try {
        const gmailRes = await getGmailEmails(); // { connected, emails }

        if (gmailRes && Array.isArray(gmailRes.emails)) {
          applyList(gmailRes.emails, gmailRes.connected ? "gmail" : "demo", !!gmailRes.connected);
          if (gmailRes.connected) return;
        }
      } catch {
        // ignore -> fallback to demo
      }

      // ✅ fallback to demo emails
      const demoList = await getEmails();
      applyList(demoList, "demo", false);
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
    saveSelectedEmailBody(selectedEmail.body);
    navigate("/analyzer");
  };

  // ✅ CONNECTED button click => disconnect
  // ✅ NOT connected => connect
  const onToggleGmail = async () => {
    if (loading) return;

    if (gmailConnected) {
      setLoading(true);
      try {
        await disconnectGmail();

        // Re-check from backend (real status)
        let isConnected = false;
        try {
          isConnected = await checkAuthStatus();
        } catch {
          isConnected = false;
        }

        setGmailConnected(isConnected);
        INBOX_MEM_CACHE.gmailConnected = isConnected;

        // If disconnected, clear cache & reload demo
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
      connectGmail(); // redirects
    }
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 520px", gap: 2 }}>
      {/* LEFT: Inbox list */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Inbox
          </Typography>

          {/* ✅ Connected => GREEN + clickable to disconnect */}
          <Button
            variant="contained"
            onClick={onToggleGmail}
            disabled={loading} // ✅ only disable while loading
            title={gmailConnected ? "Click to disconnect" : "Click to connect"}
            sx={{
              bgcolor: gmailConnected ? "#2e7d32" : "#d32f2f",
              color: "#fff",
              fontWeight: 700,
              textTransform: "uppercase",
              "&:hover": {
                bgcolor: gmailConnected ? "#1b5e20" : "#b71c1c",
              },
              // ✅ keep color even when disabled (loading state)
              "&.Mui-disabled": {
                bgcolor: gmailConnected ? "#2e7d32" : "#d32f2f",
                color: "#fff",
                opacity: 1,
              },
            }}
          >
            {gmailConnected ? "CONNECTED" : "Connect email account"}
          </Button>
        </Box>

        <Card>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              placeholder="Search Emails"
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

            <IconButton title="Filters (demo)">
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
                      gridTemplateColumns: "40px 220px 1fr",
                      gap: 1,
                      alignItems: "center",
                      py: 1,
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      cursor: "pointer",
                      bgcolor: selectedEmail?.id === e.id ? "rgba(0,0,0,0.04)" : "transparent",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
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

                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {e.sender}
                    </Typography>

                    <Typography variant="body2">
                      <b>{e.subject}</b>{" "}
                      <span style={{ opacity: 0.75 }}>
                        — {e.body.slice(0, 60)}
                        {e.body.length > 60 ? "..." : ""}
                      </span>
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Card>
      </Box>

      {/* RIGHT: Preview */}
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

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                {selectedEmail.body}
              </Typography>

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
  );
}
