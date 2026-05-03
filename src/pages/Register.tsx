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
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser(email, password);
      navigate("/pending", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

 const inputSx = {
  "& .MuiOutlinedInput-root": {
    height: 58,
    borderRadius: 2.5,
    color: "white",
    bgcolor: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.28)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.5)",
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
    color: "rgba(255,255,255,0.75)",
    opacity: 1,
  },

  "& input:-webkit-autofill": {
    WebkitBoxShadow:
      "0 0 0 1000px rgba(255,255,255,0.15) inset !important",
    WebkitTextFillColor: "white !important",
    caretColor: "white",
    borderRadius: "12px",
    transition: "background-color 9999s ease-in-out 0s",
  },

  "& input:-webkit-autofill:hover": {
    WebkitBoxShadow:
      "0 0 0 1000px rgba(255,255,255,0.15) inset !important",
    WebkitTextFillColor: "white !important",
  },

  "& input:-webkit-autofill:focus": {
    WebkitBoxShadow:
      "0 0 0 1000px rgba(255,255,255,0.15) inset !important",
    WebkitTextFillColor: "white !important",
  },

  "& input:-webkit-autofill:active": {
    WebkitBoxShadow:
      "0 0 0 1000px rgba(255,255,255,0.15) inset !important",
    WebkitTextFillColor: "white !important",
  },
};

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
          "linear-gradient(135deg, #eef4ff 0%, #f8fbff 45%, #dfeaff 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(37,99,235,0.22), rgba(37,99,235,0.02) 65%)",
          top: -190,
          right: -130,
          filter: "blur(10px)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(15,61,145,0.16), rgba(15,61,145,0.02) 70%)",
          bottom: -170,
          left: -130,
          filter: "blur(12px)",
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
          border: "1px solid rgba(255,255,255,0.78)",
          background: "rgba(255,255,255,0.76)",
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
            {/* Left side */}
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
                  "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(248,251,255,0.74))",
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
                  top: 90,
                  right: -100,
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  width: 280,
                  height: 280,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(15,61,145,0.10), transparent 70%)",
                  bottom: 40,
                  left: -90,
                }}
              />

              <Stack spacing={4} sx={{ position: "relative", zIndex: 1 }}>
                <Typography
                  sx={{
                    fontSize: { md: 34, lg: 38 },
                    lineHeight: 1.15,
                    fontWeight: 950,
                    letterSpacing: "-0.05em",
                    color: "#0f172a",
                  }}
                >
                  <Box component="span" sx={{ color: "#2563eb" }}>
                    E-mail Threat
                  </Box>{" "}
                  Detection System
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 4,
                      display: "grid",
                      placeItems: "center",
                      color: "white",
                      background:
                        "linear-gradient(135deg, #0f3d91 0%, #3f66f5 100%)",
                      boxShadow: "0 18px 35px rgba(37,99,235,0.28)",
                    }}
                  >
                    <ShieldOutlinedIcon fontSize="large" />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: "#0f172a",
                        fontSize: 18,
                      }}
                    >
                      Secure Account Access
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 16 }}>
                      Register and wait for admin approval
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            {/* Right form side */}
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
                  "linear-gradient(145deg, rgba(15,23,42,0.88), rgba(15,61,145,0.82))",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  width: 320,
                  height: 320,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  top: -125,
                  left: -80,
                  filter: "blur(5px)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: 380,
                  height: 380,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.16)",
                  bottom: -170,
                  right: -130,
                  filter: "blur(6px)",
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
                  background: "rgba(255,255,255,0.14)",
                  backdropFilter: "blur(22px)",
                  boxShadow: "0 24px 70px rgba(2,6,23,0.22)",
                }}
              >
                <Stack spacing={2.3}>
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
                      <PersonAddAlt1Icon fontSize="large" />
                    </Box>

                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 950,
                        color: "white",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      Create Account!
                    </Typography>

                    <Typography
                      textAlign="center"
                      sx={{
                        color: "rgba(255,255,255,0.78)",
                        fontWeight: 500,
                      }}
                    >
                      Register and wait until admin approves your account.
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
                                sx={{ color: "rgba(255,255,255,0.75)" }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={inputSx}
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
                                sx={{ color: "rgba(255,255,255,0.75)" }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword((prev) => !prev)}
                                edge="end"
                                sx={{ color: "rgba(255,255,255,0.75)" }}
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
                        sx={inputSx}
                      />

                      <TextField
                        placeholder="Confirm password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon
                                sx={{ color: "rgba(255,255,255,0.75)" }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() =>
                                  setShowConfirmPassword((prev) => !prev)
                                }
                                edge="end"
                                sx={{ color: "rgba(255,255,255,0.75)" }}
                              >
                                {showConfirmPassword ? (
                                  <VisibilityOffOutlinedIcon />
                                ) : (
                                  <VisibilityOutlinedIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={inputSx}
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
                          "Register"
                        )}
                      </Button>
                    </Stack>
                  </Box>

                  <Typography
                    textAlign="center"
                    sx={{ color: "rgba(255,255,255,0.78)" }}
                  >
                    Already have an account?{" "}
                    <Link
                      component={RouterLink}
                      to="/login"
                      underline="hover"
                      sx={{
                        color: "white",
                        fontWeight: 900,
                      }}
                    >
                      Login
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