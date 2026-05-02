import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { AppUserProfile, UserRole, UserStatus } from "../types/user";

type UserRow = AppUserProfile & {
  id: string;
};

export default function AdminPanel() {
const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const snap = await getDocs(collection(db, "users"));

      const list = snap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as AppUserProfile),
      }));

      list.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return users;

    return users.filter((user) => {
      return (
        user.email?.toLowerCase().includes(q) ||
        user.status?.toLowerCase().includes(q) ||
        user.role?.toLowerCase().includes(q)
      );
    });
  }, [users, query]);

  async function updateUserStatus(uid: string, status: UserStatus) {
    setActionLoading(`${uid}-${status}`);
    setError("");

    try {
      await updateDoc(doc(db, "users", uid), {
        status,
        ...(status === "approved"
          ? { approvedAt: serverTimestamp() }
          : status === "rejected"
          ? { rejectedAt: serverTimestamp() }
          : {}),
      });

      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setActionLoading("");
    }
  }

  async function updateUserRole(uid: string, role: UserRole) {
    setActionLoading(`${uid}-${role}`);
    setError("");

    try {
      await updateDoc(doc(db, "users", uid), {
        role,
        status: role === "admin" ? "approved" : undefined,
        updatedAt: serverTimestamp(),
      });

      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionLoading("");
    }
  }

  function statusColor(status: UserStatus) {
    if (status === "approved") return "success";
    if (status === "rejected") return "error";
    return "warning";
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Card
          sx={{
            borderRadius: 4,
            background: "linear-gradient(135deg, #0f3d91, #071d49)",
            color: "white",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.14)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <AdminPanelSettingsIcon fontSize="large" />
                </Box>

                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>
                    Admin Panel
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.75)" }}>
                    Approve users and manage admin access.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
  <Button
    variant="outlined"
    startIcon={<ArrowBackIcon />}
    onClick={() => navigate("/inbox")}
    sx={{
      borderColor: "rgba(255,255,255,0.6)",
      color: "white",
      fontWeight: 800,
      borderRadius: 2,
      "&:hover": {
        borderColor: "white",
        backgroundColor: "rgba(255,255,255,0.1)",
      },
    }}
  >
    Back to Inbox
  </Button>

  <Button
    variant="outlined"
    startIcon={<RefreshIcon />}
    onClick={loadUsers}
    sx={{
      borderColor: "rgba(255,255,255,0.6)",
      color: "white",
      fontWeight: 800,
      borderRadius: 2,
      "&:hover": {
        borderColor: "white",
        backgroundColor: "rgba(255,255,255,0.1)",
      },
    }}
  >
    Refresh
  </Button>
</Stack>
            </Stack>
          </CardContent>
        </Card>

        {error && <Alert severity="error">{error}</Alert>}

        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                label="Search users"
                placeholder="Search by email, status, or role"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
              />

              <Typography color="text.secondary">
                Total users: <strong>{users.length}</strong>
              </Typography>

              <Divider />

              {loading ? (
                <Stack alignItems="center" sx={{ py: 5 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2, fontWeight: 700 }}>
                    Loading users...
                  </Typography>
                </Stack>
              ) : filteredUsers.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4 }}>
                  No users found.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {filteredUsers.map((user) => (
                    <Card
                      key={user.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        bgcolor:
                          user.status === "pending" ? "#fff8e1" : "white",
                      }}
                    >
                      <CardContent>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={2}
                          alignItems={{ xs: "flex-start", md: "center" }}
                          justifyContent="space-between"
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 900 }}>
                              {user.email}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              UID: {user.uid}
                            </Typography>

                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              spacing={1}
                              sx={{ mt: 1.5 }}
                            >
                              <Chip
                                label={`Status: ${user.status}`}
                                color={statusColor(user.status)}
                                size="small"
                                sx={{ fontWeight: 800 }}
                              />

                              <Chip
                                label={`Role: ${user.role}`}
                                color={user.role === "admin" ? "primary" : "default"}
                                size="small"
                                sx={{ fontWeight: 800 }}
                              />

                              <Chip
                                label={
                                  user.gmailConnected
                                    ? "Gmail Connected"
                                    : "Gmail Not Connected"
                                }
                                color={user.gmailConnected ? "success" : "default"}
                                size="small"
                                sx={{ fontWeight: 800 }}
                              />
                            </Stack>
                          </Box>

                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            justifyContent="flex-end"
                          >
                            <Button
                              variant="contained"
                              color="success"
                              disabled={
                                actionLoading === `${user.id}-approved` ||
                                user.status === "approved"
                              }
                              onClick={() =>
                                updateUserStatus(user.id, "approved")
                              }
                            >
                              Approve
                            </Button>

                            <Button
                              variant="outlined"
                              color="error"
                              disabled={
                                actionLoading === `${user.id}-rejected` ||
                                user.status === "rejected"
                              }
                              onClick={() =>
                                updateUserStatus(user.id, "rejected")
                              }
                            >
                              Reject
                            </Button>

                            {user.role !== "admin" ? (
                              <Button
                                variant="outlined"
                                disabled={actionLoading === `${user.id}-admin`}
                                onClick={() => updateUserRole(user.id, "admin")}
                              >
                                Make Admin
                              </Button>
                            ) : (
                              <Button
                                variant="outlined"
                                color="warning"
                                disabled={actionLoading === `${user.id}-user`}
                                onClick={() => updateUserRole(user.id, "user")}
                              >
                                Remove Admin
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}