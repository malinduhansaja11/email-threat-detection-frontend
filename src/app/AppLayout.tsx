import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  Button,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 240;

const navItems = [
  { label: "Inbox / Emails", path: "/", icon: <InboxIcon /> },
  { label: "Analyzer", path: "/analyzer", icon: <SearchIcon /> },
  { label: "History", path: "/history", icon: <HistoryIcon /> },
  { label: "Reports", path: "/reports", icon: <AssessmentIcon /> },
  { label: "Settings", path: "/settings", icon: <SettingsIcon /> },
];

export default function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to login page
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap component="div">
            AI-BASED E-MAIL THREAT DETECTION SYSTEM
          </Typography>

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            variant="outlined"
            sx={{
              borderColor: "rgba(255,255,255,0.5)",
              color: "white",
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
          },
        }}
      >
        <Toolbar />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{ "&.active": { bgcolor: "action.selected" } }}
              end={item.path === "/"}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1,}}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}