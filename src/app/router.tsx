import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout.tsx";
import Inbox from "../pages/Inbox.tsx";
import Analyzer from "../pages/Analyzer.tsx";
import History from "../pages/History.tsx";
import Reports from "../pages/Reports.tsx";
import Settings from "../pages/Settings.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Inbox /> },
      
      
      { path: "inbox", element: <Inbox /> },
      { path: "analyzer", element: <Analyzer /> },
      { path: "history", element: <History /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
      { path: "/history", element: <History /> }
    ],
  },
]);
