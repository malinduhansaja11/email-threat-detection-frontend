import { Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import type { AnalyzeResponse } from "../../types/analyzer";

export default function ResultsPanel({ result }: { result: AnalyzeResponse | null }) {
  if (!result) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Results Panel</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Run detection to see results.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Results Panel</Typography>

        <Typography variant="subtitle2" sx={{ mt: 2 }}>
          Risk Score
        </Typography>
        <Chip label={`${result.risk_score}%`} />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">Obfuscation Tokens (confidence)</Typography>

        <Stack direction="column" spacing={1} sx={{ mt: 1, maxHeight: 260, overflow: "auto" }}>
          {result.tokens.map((t, idx) => {
            if (result.labels[idx] === 0) return null;
            return (
              <Chip
                key={`${t}-${idx}`}
                label={`${t} • ${(result.scores[idx] * 100).toFixed(0)}%`}
                variant="outlined"
              />
            );
          })}

          {result.obf_tokens.length === 0 && (
            <Typography variant="body2">No obfuscation detected.</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
