import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { User } from "firebase/auth";
import { watchAuthState, getCurrentUserProfile } from "../services/authService";
import type { AppUserProfile } from "../types/user";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";

type Props = {
  children: ReactNode;
  adminOnly?: boolean;
};

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (user) => {
      setFirebaseUser(user);

      if (user) {
        const userProfile = await getCurrentUserProfile(user.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "#f5f7fb",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography sx={{ fontWeight: 700 }}>Checking account...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return <Navigate to="/pending" replace />;
  }

  if (profile.status !== "approved") {
    return <Navigate to="/pending" replace />;
  }

  if (adminOnly && profile.role !== "admin") {
    return <Navigate to="/inbox" replace />;
  }

  return <>{children}</>;
}