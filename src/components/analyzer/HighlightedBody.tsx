import { Card, CardContent, Typography } from "@mui/material";
import type { AnalyzeResponse } from "../../types/analyzer";

export default function HighlightedBody({ result }: { result: AnalyzeResponse | null }) {
  const THRESHOLD = 0.97; // 97%

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Highlight in Body
        </Typography>

        {!result ? (
          <Typography variant="body2">No content to highlight yet.</Typography>
        ) : (
          <Typography variant="body1" sx={{ lineHeight: 2 }}>
            {result.tokens.map((t, idx) => {
              const score = result.scores?.[idx] ?? 0;
              const isRisk = score >= THRESHOLD;

              return (
                <span
                  key={idx}
                  style={{
                    padding: "2px 6px",
                    marginRight: 6,
                    borderRadius: 8,
                    background: isRisk ? "rgba(255,0,0,0.12)" : "transparent",
                    border: isRisk ? "1px solid rgba(255,0,0,0.25)" : "1px solid transparent",
                    display: "inline-block",
                  }}
                  title={
                    isRisk
                      ? `RISK • ${(score * 100).toFixed(1)}%`
                      : `SAFE • ${(score * 100).toFixed(1)}%`
                  }
                >
                  {t}
                </span>
              );
            })}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
