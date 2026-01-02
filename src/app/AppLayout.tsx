import { Outlet, NavLink } from "react-router-dom";
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
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";

const drawerWidth = 240;

const navItems = [
  { label: "Inbox / Emails", path: "/", icon: <InboxIcon /> },
  { label: "Analyzer", path: "/analyzer", icon: <SearchIcon /> },
  { label: "History", path: "/history", icon: <HistoryIcon /> },
  { label: "Reports", path: "/reports", icon: <AssessmentIcon /> },
  { label: "Settings", path: "/settings", icon: <SettingsIcon /> },
];

export default function AppLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Obfuscation Word Detector (Demo)
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
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

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
