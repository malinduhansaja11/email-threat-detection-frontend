import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUserProfile,
  logoutUser,
  watchAuthState,
} from "../services/authService";
import type { AppUserProfile } from "../types/user";

export default function PendingApproval() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);

  async function loadProfile() {
    setLoading(true);

    const userProfile = await getCurrentUserProfile();
    setProfile(userProfile);

    if (userProfile?.status === "approved") {
      navigate("/inbox", { replace: true });
    }

    setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = watchAuthState(async (user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      await loadProfile();
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await logoutUser();
    navigate("/login", { replace: true });
  }

  const status = profile?.status || "pending";

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
          maxWidth: 540,
          borderRadius: 4,
          boxShadow: "0 18px 50px rgba(17, 24, 39, 0.12)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            {loading ? (
              <CircularProgress />
            ) : status === "rejected" ? (
              <BlockIcon sx={{ fontSize: 70, color: "#d32f2f" }} />
            ) : status === "approved" ? (
              <CheckCircleOutlineIcon sx={{ fontSize: 70, color: "#2e7d32" }} />
            ) : (
              <HourglassTopIcon sx={{ fontSize: 70, color: "#ed6c02" }} />
            )}

            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {status === "rejected"
                ? "Account Rejected"
                : status === "approved"
                ? "Account Approved"
                : "Waiting for Admin Approval"}
            </Typography>

            <Chip
              label={`Status: ${status.toUpperCase()}`}
              color={
                status === "approved"
                  ? "success"
                  : status === "rejected"
                  ? "error"
                  : "warning"
              }
              sx={{ fontWeight: 800 }}
            />

            <Typography color="text.secondary">
              {status === "rejected"
                ? "Your account request was rejected by the admin."
                : status === "approved"
                ? "Your account has been approved. You can continue to the inbox."
                : "Your account was created successfully. Admin must approve your account before you can use the system."}
            </Typography>

            {profile?.email && (
              <Alert severity="info" sx={{ width: "100%", textAlign: "left" }}>
                Logged in as: <strong>{profile.email}</strong>
              </Alert>
            )}

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={loadProfile}>
                Refresh Status
              </Button>

              {status === "approved" && (
                <Button variant="contained" onClick={() => navigate("/inbox")}>
                  Continue
                </Button>
              )}

              <Button color="error" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}