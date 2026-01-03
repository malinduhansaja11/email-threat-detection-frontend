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
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import EmailInputCard from "../components/analyzer/EmailInputCard.tsx";
import ResultsPanel from "../components/analyzer/ResultsPanel.tsx";
import HighlightedBody from "../components/analyzer/HighlightedBody.tsx";

import { analyzeEmailBody } from "../services/analyzerService";
import type { AnalyzeResponse } from "../types/analyzer";
import { loadSelectedEmailBody, clearSelectedEmailBody } from "../services/selectedEmail";

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
    title: "Phishing Link Analyzer",
    desc: "Extract and score links for risky domains, redirects and phishing indicators.",
    icon: <LinkOutlinedIcon />,
    badge: "Links",
  },
};

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

export default function Analyzer() {
  const [activeSection, setActiveSection] = useState<AnalyzerSection>("obfuscation");

  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    const saved = loadSelectedEmailBody();
    if (saved) {
      setBody(saved);
      clearSelectedEmailBody();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAnalyze = async () => {
    setLoading(true);
    try {
      const res = await analyzeEmailBody(body);
      setResult(res);
    } finally {
      setLoading(false);
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

      {/* Other sections - placeholders with better UI */}
      {activeSection !== "obfuscation" && (
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
      )}
    </Box>
  );
}
