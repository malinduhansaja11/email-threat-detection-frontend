import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { getCurrentUserProfile, logoutUser } from "../services/authService";
import type { AppUserProfile } from "../types/user";
import { disconnectGmail } from "../services/gmailAuthService";
import { clearInboxMemoryCache } from "../services/inboxCache";
import { clearSelectedEmail } from "../services/selectedEmail";

const drawerWidth = 250;

const userNavItems = [
  {
    label: "Inbox / Emails",
    path: "/inbox",
    icon: <InboxIcon />,
  },
  {
    label: "Analyzer",
    path: "/analyzer",
    icon: <SearchIcon />,
  },
  {
    label: "History",
    path: "/history",
    icon: <HistoryIcon />,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: <AssessmentIcon />,
  },
  // {
  //   label: "Settings",
  //   path: "/settings",
  //   icon: <SettingsIcon />,
  // },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<AppUserProfile | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then(setProfile);
  }, []);

  async function handleLogout() {
  try {
    // 1. Disconnect Gmail OAuth from backend
    await disconnectGmail();
  } catch (error) {
    console.error("Failed to disconnect Gmail OAuth:", error);
  } finally {
    // 2. Clear Gmail emails from frontend memory
    clearInboxMemoryCache();

    // 3. Clear selected email/analyzer email
    clearSelectedEmail();

    // 4. Logout app user
    await logoutUser();

    // 5. Clear extra local/session saved data
    localStorage.removeItem("selected_email");
    localStorage.removeItem("gmail_connected");
    sessionStorage.clear();

    // 6. Reset profile state
    setProfile(null);

    // 7. Go to login
    navigate("/login", { replace: true });
  }
}

  function isActive(path: string) {
    if (path === "/inbox") {
      return location.pathname === "/" || location.pathname === "/inbox";
    }

    return location.pathname.startsWith(path);
  }




  const navItems =
    profile?.role === "admin"
      ? [
          ...userNavItems,
          {
            label: "Admin Panel",
            path: "/admin",
            icon: <AdminPanelSettingsIcon />,
          },
        ]
      : userNavItems;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f7fb" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "#0f3d91",
          boxShadow: "0 8px 28px rgba(15, 61, 145, 0.25)",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.14)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <ShieldOutlinedIcon />
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
             E-mail Threat Detection System
            </Typography>

            {profile?.email && (
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.72)" }}
              >
                {profile.email} · {profile.role}
              </Typography>
            )}
          </Box>

          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            variant="outlined"
            sx={{
              borderColor: "rgba(255,255,255,0.5)",
              color: "white",
              fontWeight: 800,
              borderRadius: 2,
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "white",
            borderRight: "1px solid #e5e7eb",
          },
        }}
      >
        <Toolbar />

        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: "#eef3ff",
              border: "1px solid #dce7ff",
            }}
          >
            <StackUser profile={profile} />
          </Box>
        </Box>

        <Divider />

        <List sx={{ px: 1.5, py: 2 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "#e7efff",
                  color: "#0f3d91",
                  fontWeight: 900,
                },
                "&.Mui-selected:hover": {
                  bgcolor: "#dce8ff",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? "#0f3d91" : "inherit",
                  minWidth: 38,
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 900 : 700,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Toolbar />

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function StackUser({ profile }: { profile: AppUserProfile | null }) {
  const letter = profile?.email?.[0]?.toUpperCase() || "U";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar sx={{ bgcolor: "#0f3d91", fontWeight: 900 }}>{letter}</Avatar>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {profile?.email || "User"}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {profile?.role === "admin" ? "Administrator" : "Approved User"}
        </Typography>
      </Box>
    </Box>
  );
}