import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";

type Props = {
  body: string;
  setBody: (v: string) => void;
  onAnalyze: () => void;
  loading?: boolean;
};

export default function EmailInputCard({ body, setBody, onAnalyze, loading }: Props) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Email Body
        </Typography>

        <TextField
          multiline
          minRows={8}
          fullWidth
          placeholder="Paste email body here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button variant="contained" onClick={onAnalyze} disabled={loading || !body.trim()}>
            {loading ? "Detecting..." : "Detect Obfuscation"}
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              setBody("Please verify your p@ssw0rd for invoice2025 and api_v2 update.")
            }
            disabled={loading}
          >
            Use Sample
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
