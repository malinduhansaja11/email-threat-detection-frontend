import { Card, CardContent, Typography } from "@mui/material";
import type { AnalyzeResponse } from "../../types/analyzer";

export default function HighlightedBody({ result }: { result: AnalyzeResponse | null }) {
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
              const isObf = result.labels[idx] === 1;
              return (
                <span
                  key={idx}
                  style={{
                    padding: "2px 6px",
                    marginRight: 6,
                    borderRadius: 8,
                    background: isObf ? "rgba(255,0,0,0.12)" : "transparent",
                    border: isObf ? "1px solid rgba(255,0,0,0.25)" : "1px solid transparent",
                    display: "inline-block",
                  }}
                  title={isObf ? `OBF • ${(result.scores[idx] * 100).toFixed(0)}%` : "NORMAL"}
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
