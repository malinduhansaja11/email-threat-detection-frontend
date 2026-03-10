import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import { getHistory, deleteHistory } from "../services/historyService";
import type { HistoryItem } from "../services/historyService";

function fmtDate(ts: any) {
  try {
    if (!ts) return "";
    if (typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString();
    }
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function getTypeColor(type?: string) {
  if (type === "obfuscation") return "error";
  if (type === "header") return "info";
  if (type === "time") return "secondary";
  if (type === "phishingLinks") return "warning";
  return "default";
}

function getRiskColor(score?: number) {
  const value = score ?? 0;
  if (value >= 60) return "error";
  if (value >= 30) return "warning";
  return "success";
}

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((x) => {
      const subject = (x.subject ?? "").toLowerCase();
      const sender = (x.sender ?? "").toLowerCase();
      const tokens = (x.obf_tokens ?? []).join(" ").toLowerCase();
      const type = (x.type ?? "").toLowerCase();
      const source = (x.source ?? "").toLowerCase();
      const senderDomain = (x.sender_domain ?? "").toLowerCase();
      const verdict = (x.url_verdict ?? "").toLowerCase();
      const date = (x.email_date ?? "").toLowerCase();
      const preview = (x.body_preview ?? "").toLowerCase();

      return (
        subject.includes(s) ||
        sender.includes(s) ||
        tokens.includes(s) ||
        type.includes(s) ||
        source.includes(s) ||
        senderDomain.includes(s) ||
        verdict.includes(s) ||
        date.includes(s) ||
        preview.includes(s)
      );
    });
  }, [items, q]);

  const onDelete = async (id: string) => {
    await deleteHistory(id);
    await load();
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Analysis History
        </Typography>

        <IconButton onClick={load} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Stack>

      <Card>
        <CardContent sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            fullWidth
            placeholder="Search by subject / sender / type / tokens / domain / verdict"
            size="small"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Chip
            label={loading ? "Loading..." : `${filtered.length} records`}
            sx={{ fontWeight: 700 }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {filtered.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              No history records found. Analyze an email first.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {filtered.map((h) => (
                <Box key={h.id}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 130px 44px",
                      gap: 1,
                      alignItems: "center",
                      py: 1.2,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {h.subject ?? "Analyzed Email"}
                      </Typography>

                      <Typography variant="body2" sx={{ opacity: 0.75 }}>
                        From: {h.sender ?? "unknown"} • {fmtDate(h.created_at)}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                        <Chip
                          size="small"
                          label={`Type: ${h.type ?? "unknown"}`}
                          color={getTypeColor(h.type) as any}
                        />
                        <Chip size="small" label={`Source: ${h.source}`} />
                      </Box>

                      {h.type === "obfuscation" && (
                        <>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                            <Chip
                              size="small"
                              label={`Risk: ${Math.round(h.risk_score ?? 0)}`}
                              color={getRiskColor(h.risk_score) as any}
                            />
                            <Chip size="small" label={`Tokens: ${(h.obf_tokens ?? []).length}`} />
                          </Box>

                          {(h.obf_tokens ?? []).length > 0 && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <b>Detected:</b> {(h.obf_tokens ?? []).slice(0, 8).join(", ")}
                              {(h.obf_tokens ?? []).length > 8 ? " ..." : ""}
                            </Typography>
                          )}
                        </>
                      )}

                      {h.type === "header" && (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                          <Chip size="small" label={`SPF: ${h.spf ?? "unknown"}`} />
                          <Chip size="small" label={`DKIM: ${h.dkim ?? "unknown"}`} />
                          <Chip size="small" label={`DMARC: ${h.dmarc ?? "unknown"}`} />
                          <Chip size="small" label={`Domain: ${h.sender_domain ?? "—"}`} />
                          <Chip size="small" label={`Headers: ${h.header_count ?? 0}`} />
                        </Box>
                      )}

                      {h.type === "time" && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <b>Email Date:</b> {h.email_date ?? "—"}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <b>Body Preview:</b> {h.body_preview ?? "—"}
                          </Typography>
                        </Box>
                      )}

                      {h.type === "phishingLinks" && (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                          <Chip size="small" label={`URLs: ${h.url_count ?? 0}`} />
                          <Chip size="small" label={`Verdict: ${h.url_verdict ?? "unknown"}`} />
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ justifySelf: "end" }}>
                      {h.type === "obfuscation" ? (
                        <Chip
                          label={
                            (h.risk_score ?? 0) >= 60
                              ? "High"
                              : (h.risk_score ?? 0) >= 30
                              ? "Medium"
                              : "Low"
                          }
                          color={getRiskColor(h.risk_score) as any}
                          sx={{ fontWeight: 800 }}
                        />
                      ) : (
                        <Chip
                          label={h.type ?? "Record"}
                          color={getTypeColor(h.type) as any}
                          sx={{ fontWeight: 800 }}
                        />
                      )}
                    </Box>

                    <Box sx={{ justifySelf: "end" }}>
                      <IconButton onClick={() => onDelete(h.id)} title="Delete">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Divider />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}