import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { getCurrentUserProfile, loginUser } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
     
  const inputSx = {
  "& .MuiOutlinedInput-root": {
    height: 58,
    borderRadius: 2.5,
    color: "white",
    bgcolor: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.26)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.48)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "white",
    },
  },

  "& input": {
    color: "white",
    backgroundColor: "transparent !important",
  },

  "& input::placeholder": {
    color: "rgba(255,255,255,0.72)",
    opacity: 1,
  },

  "& input:-webkit-autofill": {
    WebkitBoxShadow:
      "0 0 0 1000px rgba(255,255,255,0.12) inset !important",
    WebkitTextFillColor: "white !important",
    caretColor: "white",
    borderRadius: "12px",
    transition: "background-color 9999s ease-in-out 0s",
  },

  "& input:-webkit-autofill:hover": {
    WebkitBoxShadow:
      "0 0 0 1000px rgba(255,255,255,0.12) inset !important",
    WebkitTextFillColor: "white !important",
  },

  "& input:-webkit-autofill:focus": {
    WebkitBoxShadow:
      "0 0 0 1000px rgba(255,255,255,0.12) inset !important",
    WebkitTextFillColor: "white !important",
  },

  "& input:-webkit-autofill:active": {
    WebkitBoxShadow:
      "0 0 0 1000px rgba(255,255,255,0.12) inset !important",
    WebkitTextFillColor: "white !important",
  },
};

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
        position: "relative",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        px: { xs: 2, md: 4 },
        py: 4,
        background:
          "linear-gradient(135deg, #eef4ff 0%, #f8fbff 45%, #e9f1ff 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(37,99,235,0.22), rgba(37,99,235,0.02) 65%)",
          top: -170,
          right: -120,
          filter: "blur(8px)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(15,61,145,0.18), rgba(15,61,145,0.02) 70%)",
          bottom: -150,
          left: -120,
          filter: "blur(10px)",
        },
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 1120,
          minHeight: { xs: "auto", md: 650 },
          borderRadius: { xs: 5, md: 7 },
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
          border: "1px solid rgba(255,255,255,0.75)",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 30px 90px rgba(15, 23, 42, 0.16)",
        }}
      >
        <CardContent sx={{ p: 0, height: "100%" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
              minHeight: { xs: "auto", md: 650 },
            }}
          >
            {/* Left design section */}
            <Box
              sx={{
                position: "relative",
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                justifyContent: "center",
                px: { md: 7, lg: 8 },
                py: 7,
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(248,251,255,0.68))",
                borderRight: "1px solid rgba(226,232,240,0.9)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  width: 360,
                  height: 360,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(37,99,235,0.12), transparent 68%)",
                  top: 60,
                  right: -120,
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  width: 260,
                  height: 260,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(15,61,145,0.10), transparent 70%)",
                  bottom: 30,
                  left: -80,
                }}
              />

              <Stack spacing={4} sx={{ position: "relative", zIndex: 1 }}>
                

               

                <Typography
                  sx={{
                    maxWidth: 520,
                    fontSize: 30,
                    lineHeight: 1.35,
                    fontWeight: 800,
                    color: "#111827",
                    letterSpacing: "-0.03em",
                  }}
                >
              {" "}
                  <Box component="span" sx={{ color: "#2563eb" }}>
                    E-mail Threat
                  </Box>{" "}
                  Detection System
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 4,
                      display: "grid",
                      placeItems: "center",
                      color: "white",
                      background:
                        "linear-gradient(135deg, #0f3d91 0%, #3f66f5 100%)",
                      boxShadow: "0 18px 30px rgba(37,99,235,0.28)",
                    }}
                  >
                    <ShieldOutlinedIcon fontSize="large" />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                      Secure Mail Analysis
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 14 }}>
                      Detect suspicious and risky emails quickly
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            {/* Login form section */}
            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 2.5, sm: 5, md: 6 },
                py: { xs: 5, md: 6 },
                overflow: "hidden",
                background:
                  "linear-gradient(145deg, rgba(15,23,42,0.88), rgba(15,61,145,0.80))",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.22)",
                  top: -115,
                  left: -70,
                  filter: "blur(4px)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: 360,
                  height: 360,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  bottom: -160,
                  right: -120,
                  filter: "blur(5px)",
                },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 430,
                  position: "relative",
                  zIndex: 1,
                  borderRadius: 5,
                  p: { xs: 3, sm: 4 },
                  border: "1px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.13)",
                  backdropFilter: "blur(22px)",
                  boxShadow: "0 24px 70px rgba(2,6,23,0.22)",
                }}
              >
                <Stack spacing={2.5}>
                  <Stack alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 4,
                        bgcolor: "rgba(255,255,255,0.16)",
                        color: "white",
                        display: "grid",
                        placeItems: "center",
                        border: "1px solid rgba(255,255,255,0.26)",
                      }}
                    >
                      <ShieldOutlinedIcon fontSize="large" />
                    </Box>

                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 950,
                        color: "white",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      Hello!
                    </Typography>

                    <Typography
                      textAlign="center"
                      sx={{
                        color: "rgba(255,255,255,0.78)",
                        fontWeight: 500,
                      }}
                    >
                      We are really happy to see you again.
                    </Typography>
                  </Stack>

                  {error && (
                    <Alert
                      severity="error"
                      sx={{
                        borderRadius: 2,
                        bgcolor: "rgba(254,226,226,0.95)",
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                      <TextField
                        placeholder="Email address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailOutlinedIcon
                                sx={{ color: "rgba(255,255,255,0.72)" }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: 58,
                            borderRadius: 2.5,
                            color: "white",
                            bgcolor: "rgba(255,255,255,0.12)",
                            backdropFilter: "blur(10px)",
                            "& fieldset": {
                              borderColor: "rgba(255,255,255,0.26)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(255,255,255,0.48)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "white",
                            },
                          },
                          "& input::placeholder": {
                            color: "rgba(255,255,255,0.72)",
                            opacity: 1,
                          },
                        }}
                      />

                      <TextField
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon
                                sx={{ color: "rgba(255,255,255,0.72)" }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword((prev) => !prev)}
                                edge="end"
                                sx={{ color: "rgba(255,255,255,0.72)" }}
                              >
                                {showPassword ? (
                                  <VisibilityOffOutlinedIcon />
                                ) : (
                                  <VisibilityOutlinedIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: 58,
                            borderRadius: 2.5,
                            color: "white",
                            bgcolor: "rgba(255,255,255,0.12)",
                            backdropFilter: "blur(10px)",
                            "& fieldset": {
                              borderColor: "rgba(255,255,255,0.26)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(255,255,255,0.48)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "white",
                            },
                          },
                          "& input::placeholder": {
                            color: "rgba(255,255,255,0.72)",
                            opacity: 1,
                          },
                        }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                          mt: 1,
                          py: 1.55,
                          borderRadius: 2.5,
                          fontWeight: 950,
                          fontSize: 16,
                          textTransform: "none",
                          color: "white",
                          background:
                            "linear-gradient(135deg, #3f66f5 0%, #2563eb 100%)",
                          boxShadow: "0 18px 34px rgba(37,99,235,0.35)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #3157e8 0%, #1d4ed8 100%)",
                          },
                          "&.Mui-disabled": {
                            background: "rgba(255,255,255,0.22)",
                            color: "rgba(255,255,255,0.7)",
                          },
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} sx={{ color: "white" }} />
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </Stack>
                  </Box>

                  <Typography
                    textAlign="center"
                    sx={{ color: "rgba(255,255,255,0.78)" }}
                  >
                    Don&apos;t have an account?{" "}
                    <Link
                      component={RouterLink}
                      to="/register"
                      underline="hover"
                      sx={{
                        color: "white",
                        fontWeight: 900,
                      }}
                    >
                      Register
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}