import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { getCurrentUserProfile, loginUser } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(email, password);
      const profile = await getCurrentUserProfile(user.uid);

      if (!profile || profile.status !== "approved") {
        navigate("/pending", { replace: true });
        return;
      }

      navigate("/inbox", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#eef3ff",
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 4,
          boxShadow: "0 18px 50px rgba(17, 24, 39, 0.12)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5}>
            <Stack alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: 3,
                  bgcolor: "#0f3d91",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <ShieldOutlinedIcon fontSize="large" />
              </Box>

              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                Login
              </Typography>

              <Typography color="text.secondary" textAlign="center">
                AI-Based E-mail Threat Detection System
              </Typography>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.3,
                    borderRadius: 2,
                    fontWeight: 900,
                    bgcolor: "#0f3d91",
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Login"
                  )}
                </Button>
              </Stack>
            </Box>

            <Typography textAlign="center" color="text.secondary">
              Don&apos;t have an account?{" "}
              <Link component={RouterLink} to="/register" underline="hover">
                Register
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}