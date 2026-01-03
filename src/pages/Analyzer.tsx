import { Box } from "@mui/material";
import { useState } from "react";
import EmailInputCard from "../components/analyzer/EmailInputCard.tsx";
import ResultsPanel from "../components/analyzer/ResultsPanel.tsx";
import HighlightedBody from "../components/analyzer/HighlightedBody.tsx";
import { analyzeEmailBody } from "../services/analyzerService";
import type { AnalyzeResponse } from "../types/analyzer";
import { useEffect } from "react";
import { loadSelectedEmailBody, clearSelectedEmailBody } from "../services/selectedEmail";


export default function Analyzer() {
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
      console.log("Analyze response:", res);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <EmailInputCard body={body} setBody={setBody} onAnalyze={onAnalyze} loading={loading} />
        <HighlightedBody result={result} />
      </Box>

      <ResultsPanel result={result} />
    </Box>
  );
}
