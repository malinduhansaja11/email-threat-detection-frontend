import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import type { ChipProps, LinearProgressProps } from "@mui/material";

import type { FullEmailScanResponse } from "../../services/fullEmailScanService";

type Props = {
  open: boolean;
  loading: boolean;
  error: string;
  result: FullEmailScanResponse | null;
  emailBody: string;
  onClose: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getModuleResult(
  result: FullEmailScanResponse | null,
  moduleName: string
): Record<string, unknown> {
  const moduleData = result?.modules?.[moduleName];

  if (!moduleData || !isRecord(moduleData.result)) {
    return {};
  }

  return moduleData.result;
}

function getModuleError(
  result: FullEmailScanResponse | null,
  moduleName: string
): string | null {
  const moduleData = result?.modules?.[moduleName];

  if (!moduleData?.error) return null;

  return String(moduleData.error);
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function verdictChipColor(verdict?: string): ChipProps["color"] {
  const value = String(verdict || "").toUpperCase();

  if (value === "SAFE" || value === "LOW" || value === "ALLOW" || value === "CLEAN") {
    return "success";
  }

  if (value === "MEDIUM" || value === "WARN" || value === "WARNING") {
    return "warning";
  }

  if (
    value === "HIGH" ||
    value === "CRITICAL" ||
    value === "BLOCK" ||
    value === "QUARANTINE" ||
    value === "MALICIOUS"
  ) {
    return "error";
  }

  return "default";
}

function progressColor(verdict?: string): LinearProgressProps["color"] {
  const value = String(verdict || "").toUpperCase();

  if (value === "SAFE" || value === "LOW") return "success";
  if (value === "MEDIUM") return "warning";
  if (value === "HIGH" || value === "CRITICAL") return "error";

  return "primary";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={2}
      sx={{
        py: 0.75,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Stack>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <Box
      component="pre"
      sx={{
        mt: 1,
        p: 2,
        borderRadius: 2,
        bgcolor: "grey.100",
        overflow: "auto",
        maxHeight: 280,
        fontSize: 12,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {safeJson(value)}
    </Box>
  );
}

function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  if (!active) return null;

  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

function HighlightedEmailBody({
  body,
  tokens,
}: {
  body: string;
  tokens: string[];
}) {
  const cleanTokens = useMemo(
    () =>
      unique(tokens)
        .map((t) => t.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length),
    [tokens]
  );

  if (!body) {
    return (
      <Typography variant="body2" color="text.secondary">
        No email body available.
      </Typography>
    );
  }

  if (cleanTokens.length === 0) {
    return (
      <Box
        sx={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.8,
          p: 2,
          borderRadius: 2,
          bgcolor: "grey.50",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {body}
      </Box>
    );
  }

  const regex = new RegExp(`(${cleanTokens.map(escapeRegex).join("|")})`, "gi");
  const tokenSet = new Set(cleanTokens.map((t) => t.toLowerCase()));
  const parts = body.split(regex);

  return (
    <Box
      sx={{
        whiteSpace: "pre-wrap",
        lineHeight: 1.8,
        p: 2,
        borderRadius: 2,
        bgcolor: "grey.50",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {parts.map((part, index) => {
        const isHit = tokenSet.has(part.toLowerCase());

        if (!isHit) {
          return <span key={index}>{part}</span>;
        }

        return (
          <Box
            key={index}
            component="mark"
            sx={{
              px: 0.5,
              py: 0.15,
              borderRadius: 0.75,
              bgcolor: "error.light",
              color: "error.contrastText",
              fontWeight: 900,
            }}
          >
            {part}
          </Box>
        );
      })}
    </Box>
  );
}

export default function FullEmailScanDialog({
  open,
  loading,
  error,
  result,
  emailBody,
  onClose,
}: Props) {
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (open) setTab(0);
  }, [open, result?.email_id]);

  const finalResult = result?.final_result;
  const summary = result?.module_summary;

  const obfuscationResult = getModuleResult(result, "obfuscation");
  const temporalResult = getModuleResult(result, "temporal_evasion");
  const headerResult = getModuleResult(result, "header_spoofing");
  const urlResult = getModuleResult(result, "url_threat");

  const obfuscationError = getModuleError(result, "obfuscation");
  const temporalError = getModuleError(result, "temporal_evasion");
  const headerError = getModuleError(result, "header_spoofing");
  const urlError = getModuleError(result, "url_threat");

  const obfuscationTokens = unique([
    ...toStringArray(obfuscationResult.obf_tokens),
    ...toStringArray(obfuscationResult.obfuscated_tokens),
    ...toStringArray(obfuscationResult.suspicious_tokens),
    ...(summary?.obfuscation?.detected_tokens || []),
  ]);

  const temporalFlags = unique([
    ...toStringArray(temporalResult.temporal_flags),
    ...toStringArray(temporalResult.indicators),
    ...toStringArray(temporalResult.flags),
    ...toStringArray(temporalResult.reasons),
  ]);

  const headerDetails = unique([
    ...toStringArray(headerResult.details),
    ...toStringArray(headerResult.indicators),
    ...toStringArray(headerResult.reasons),
    ...toStringArray(headerResult.flags),
  ]);

  const urlItems = Array.isArray(urlResult.results)
    ? urlResult.results
      .map((item) => (isRecord(item) ? item : null))
      .filter((item): item is Record<string, unknown> => Boolean(item))
    : [];

  const riskScore = Math.min(
    Math.max(toNumber(finalResult?.risk_score, 0), 0),
    100
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 950 }}>
              Full Email Threat Scan
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Obfuscation, temporal evasion, header spoofing, and URL threat analysis
            </Typography>
          </Box>

          {finalResult && (
            <Chip
              label={`${finalResult.verdict} • ${riskScore}%`}
              color={verdictChipColor(finalResult.verdict)}
              sx={{ fontWeight: 900, height: 36 }}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Running full email scan...
            </Typography>
          </Stack>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && !result && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No scan result available.
          </Alert>
        )}

        {!loading && !error && result && finalResult && (
          <>
            {/* Summary top area */}
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                mb: 2,
                bgcolor: finalResult.is_threat
                  ? "rgba(244, 67, 54, 0.04)"
                  : "rgba(76, 175, 80, 0.04)",
              }}
            >
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        Summary
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: finalResult.is_threat
                            ? "error.main"
                            : "success.main",
                          fontWeight: 800,
                        }}
                      >
                        {finalResult.is_threat
                          ? "Threat indicators detected"
                          : "No major threat indicators detected"}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip
                        label={`Obfuscation: ${summary?.obfuscation?.risk_score ?? 0
                          }`}
                        color={
                          summary?.obfuscation?.ok === false ? "warning" : "default"
                        }
                        variant="outlined"
                      />

                      <Chip
                        label={`Temporal: ${summary?.temporal_evasion?.risk_level || "UNKNOWN"
                          }`}
                        color={
                          summary?.temporal_evasion?.is_threat
                            ? "error"
                            : "success"
                        }
                        variant="outlined"
                      />

                      <Chip
                        label={`Header: ${summary?.header_spoofing?.risk_level || "UNKNOWN"
                          }`}
                        color={
                          summary?.header_spoofing?.is_threat
                            ? "error"
                            : "success"
                        }
                        variant="outlined"
                      />

                      <Chip
                        label={`URL: ${summary?.url_threat?.verdict || "CLEAN"}`}
                        color={verdictChipColor(summary?.url_threat?.verdict)}
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>

                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        Final Risk Score
                      </Typography>

                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {riskScore}%
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={riskScore}
                      color={progressColor(finalResult.verdict)}
                      sx={{ height: 9, borderRadius: 99 }}
                    />
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 1 }}>
                      Main Reasons
                    </Typography>

                    <Stack spacing={0.75}>
                      {finalResult.reasons?.length ? (
                        finalResult.reasons.map((reason, index) => (
                          <Typography
                            key={index}
                            variant="body2"
                            color="text.secondary"
                          >
                            • {reason}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No detailed reasons returned.
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  {finalResult.failed_modules &&
                    finalResult.failed_modules.length > 0 && (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        Some modules failed:{" "}
                        {finalResult.failed_modules.join(", ")}
                      </Alert>
                    )}
                </Stack>
              </CardContent>
            </Card>

            {/* Tab navigation */}
            <Box
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                position: "sticky",
                top: 0,
                bgcolor: "background.paper",
                zIndex: 1,
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Obfuscation" />
                <Tab label="Temporal" />
                <Tab label="Header" />
                <Tab label="URL" />
              </Tabs>
            </Box>

            {/* Obfuscation tab */}
            <TabPanel active={tab === 0}>
              <Stack spacing={2}>
                {obfuscationError && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {obfuscationError}
                  </Alert>
                )}

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                      Obfuscation Analysis
                    </Typography>

                    <DetailRow
                      label="Risk Score"
                      value={`${obfuscationResult.risk_score ?? summary?.obfuscation?.risk_score ?? 0}`}
                    />

                    <DetailRow
                      label="Detected Token Count"
                      value={obfuscationTokens.length}
                    />

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 950, mb: 1 }}
                      >
                        Highlighted Obfuscated / Suspicious Words
                      </Typography>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {obfuscationTokens.length > 0 ? (
                          obfuscationTokens.map((token) => (
                            <Chip
                              key={token}
                              label={token}
                              color="error"
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />
                          ))
                        ) : (
                          <Chip
                            label="No obfuscated words detected"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                      Email Body Highlight View
                    </Typography>

                    <HighlightedEmailBody
                      body={emailBody}
                      tokens={obfuscationTokens}
                    />
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                      Raw Obfuscation Output
                    </Typography>

                    <JsonBlock value={obfuscationResult} />
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            {/* Temporal tab */}
            <TabPanel active={tab === 1}>
              <Stack spacing={2}>
                {temporalError && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {temporalError}
                  </Alert>
                )}

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                      Temporal Evasion Analysis
                    </Typography>

                    <DetailRow
                      label="Threat Detected"
                      value={String(
                        temporalResult.is_threat ??
                        summary?.temporal_evasion?.is_threat ??
                        false
                      )}
                    />

                    <DetailRow
                      label="Risk Level"
                      value={
                        String(
                          temporalResult.risk_level ||
                          summary?.temporal_evasion?.risk_level ||
                          "UNKNOWN"
                        )
                      }
                    />

                    <DetailRow
                      label="Confidence"
                      value={String(
                        temporalResult.confidence ??
                        summary?.temporal_evasion?.confidence ??
                        "—"
                      )}
                    />

                    <DetailRow
                      label="Model Used"
                      value={
                        String(
                          temporalResult.model_used ||
                          summary?.temporal_evasion?.model_used ||
                          "Unknown"
                        )
                      }
                    />

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 950, mb: 1 }}
                      >
                        Temporal Flags / Indicators
                      </Typography>

                      <Stack spacing={0.75}>
                        {temporalFlags.length > 0 ? (
                          temporalFlags.map((flag, index) => (
                            <Alert
                              key={index}
                              severity="warning"
                              sx={{ borderRadius: 2, py: 0 }}
                            >
                              {flag}
                            </Alert>
                          ))
                        ) : (
                          <Alert severity="success" sx={{ borderRadius: 2 }}>
                            No temporal evasion indicators returned.
                          </Alert>
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                      Raw Temporal Output
                    </Typography>

                    <JsonBlock value={temporalResult} />
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            {/* Header tab */}
            <TabPanel active={tab === 2}>
              <Stack spacing={2}>
                {headerError && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {headerError}
                  </Alert>
                )}

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                      Header Spoofing Analysis
                    </Typography>

                    <DetailRow
                      label="Threat Detected"
                      value={String(
                        headerResult.is_threat ??
                        summary?.header_spoofing?.is_threat ??
                        false
                      )}
                    />

                    <DetailRow
                      label="Risk Level"
                      value={
                        String(
                          headerResult.risk_level ||
                          summary?.header_spoofing?.risk_level ||
                          "UNKNOWN"
                        )
                      }
                    />

                    <DetailRow
                      label="Confidence"
                      value={String(
                        headerResult.confidence ??
                        summary?.header_spoofing?.confidence ??
                        "—"
                      )}
                    />

                    <DetailRow
                      label="Model Used"
                      value={
                        String(
                          headerResult.model_used ||
                          summary?.header_spoofing?.model_used ||
                          "Unknown"
                        )
                      }
                    />

                    <DetailRow
                      label="SPF"
                      value={String(headerResult.spf ?? headerResult.spf_status ?? "—")}
                    />

                    <DetailRow
                      label="DKIM"
                      value={String(headerResult.dkim ?? headerResult.dkim_status ?? "—")}
                    />

                    <DetailRow
                      label="DMARC"
                      value={String(
                        headerResult.dmarc ?? headerResult.dmarc_status ?? "—"
                      )}
                    />

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 950, mb: 1 }}
                      >
                        Header Details / Indicators
                      </Typography>

                      <Stack spacing={0.75}>
                        {headerDetails.length > 0 ? (
                          headerDetails.map((detail, index) => (
                            <Alert
                              key={index}
                              severity="warning"
                              sx={{ borderRadius: 2, py: 0 }}
                            >
                              {detail}
                            </Alert>
                          ))
                        ) : (
                          <Alert severity="success" sx={{ borderRadius: 2 }}>
                            No header spoofing indicators returned.
                          </Alert>
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                      Raw Header Output
                    </Typography>

                    <JsonBlock value={headerResult} />
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            {/* URL tab */}
            <TabPanel active={tab === 3}>
              <Stack spacing={2}>
                {urlError && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {urlError}
                  </Alert>
                )}

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                      URL Threat Analysis
                    </Typography>

                    <DetailRow
                      label="Verdict"
                      value={String(
                        urlResult.verdict || summary?.url_threat?.verdict || "CLEAN"
                      )}
                    />

                    <DetailRow
                      label="Total URLs"
                      value={String(
                        urlResult.total_urls ?? summary?.url_threat?.total_urls ?? 0
                      )}
                    />

                    <DetailRow
                      label="Maximum URL Score"
                      value={String(
                        urlResult.max_score ?? summary?.url_threat?.max_score ?? 0
                      )}
                    />

                    <DetailRow
                      label="Blocked URLs"
                      value={String(
                        urlResult.blocked_urls ??
                        summary?.url_threat?.blocked_urls ??
                        0
                      )}
                    />

                    <DetailRow
                      label="Quarantined URLs"
                      value={String(
                        urlResult.quarantine_urls ??
                        summary?.url_threat?.quarantine_urls ??
                        0
                      )}
                    />

                    <DetailRow
                      label="Warned URLs"
                      value={String(
                        urlResult.warned_urls ??
                        summary?.url_threat?.warned_urls ??
                        0
                      )}
                    />
                  </CardContent>
                </Card>

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                    Detailed URL Results
                  </Typography>

                  <Stack spacing={1.5}>
                    {urlItems.length > 0 ? (
                      urlItems.map((item, index) => {
                        const url = String(item.url || "Unknown URL");
                        const action = String(item.action || "ALLOW");
                        const suspicionScore = item.suspicion_score ?? 0;
                        const reasons = toStringArray(item.reasons);

                        return (
                          <Card key={`${url}-${index}`} variant="outlined" sx={{ borderRadius: 3 }}>
                            <CardContent>
                              <Stack
                                direction={{ xs: "column", md: "row" }}
                                justifyContent="space-between"
                                spacing={1}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 900,
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {url}
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Suspicion Score: {String(suspicionScore)}
                                  </Typography>
                                </Box>

                                <Chip
                                  label={action}
                                  color={verdictChipColor(action)}
                                  sx={{ fontWeight: 900 }}
                                />
                              </Stack>

                              <Divider sx={{ my: 1.5 }} />

                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 950, mb: 1 }}
                              >
                                Reasons
                              </Typography>

                              <Stack spacing={0.5}>
                                {reasons.length > 0 ? (
                                  reasons.map((reason, reasonIndex) => (
                                    <Typography
                                      key={reasonIndex}
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      • {reason}
                                    </Typography>
                                  ))
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No URL reason returned.
                                  </Typography>
                                )}
                              </Stack>

                              <Box sx={{ mt: 1.5 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 950 }}
                                >
                                  Raw URL Item
                                </Typography>

                                <JsonBlock value={item} />
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        No URLs found or no detailed URL result returned.
                      </Alert>
                    )}
                  </Stack>
                </Box>

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>
                      Raw URL Output
                    </Typography>

                    <JsonBlock value={urlResult} />
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}