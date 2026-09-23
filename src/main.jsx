/* eslint-disable react-hooks/set-state-in-effect */
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router";
import Root from "./layouts/Root.jsx";
import Home from "./layouts/Home.jsx";
import Register from "./Components/Authentication/Register/Register.jsx";
import Login from "./Components/Authentication/Login/Login.jsx";
import AuthProvider from "./Components/Authentication/AuthProvider/AuthProvider.jsx";
import Dashboard from "./Pages/Dashboards/Dashboard.jsx";
import UserDashboard from "./Pages/Dashboards/UserDashboard.jsx";
import UserDashboardHistory from "./Pages/Dashboards/UserDashboardHistory.jsx";
import Admin from "./Pages/Admin/Admin.jsx";
import AdminDashboard from "./Pages/Admin/AdminDashboard.jsx";
import AdminSettings from "./Pages/Admin/AdminSettings.jsx";
import Agent from "./Pages/Agent/Agent.jsx";
import AgentDashboard from "./Pages/Agent/AgentDashboard.jsx";
import AgentDashboardManagement from "./Pages/Agent/AgentDashboardManagement.jsx";
import TicketDetails from "./Pages/Agent/TicketDetails.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminDashboardOverView from "./Pages/Admin/AdminDashboardOverView.jsx";
import { UnreadProvider } from "./Context/UnreadContext.jsx";
import UseAuth from "./Hooks/UseAuth.jsx";
import { axiosInstance } from "./Hooks/UseAxiosSecure.jsx";
import { isValidJustEmail } from "./Utilities/auth.utils.js";

const queryClient = new QueryClient();

// ── Wrapper component to inject DB User ID into UnreadProvider ────────────────
export const AuthenticatedUnreadProvider = ({ children }) => {
  const { user } = UseAuth();
  const [dbUserId, setDbUserId] = useState(null);

  useEffect(() => {
    if (!user?.email || !isValidJustEmail(user.email)) {
      setDbUserId(null);
      return;
    }

    axiosInstance
      .get(`/api/users?email=${encodeURIComponent(user.email)}`)
      .then((res) => {
        if (res.data?.success) {
          setDbUserId(res.data.data.id);
        }
      })
      .catch((err) => {
        console.error("Failed to load user ID for UnreadProvider:", err);
      });
  }, [user?.email]);

  return (
    <UnreadProvider currentUserId={dbUserId}>
      {children}
    </UnreadProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [{ index: true, Component: Home }],
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
    children: [
      { index: true, Component: UserDashboard },
      {
        path: "/dashboard/user-dashboard-history",
        Component: UserDashboardHistory,
      },
      {
        path: "/dashboard/ticket/:id",
        Component: TicketDetails,
      },
    ],
  },
  {
    path: "/admin",
    Component: Admin,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "/admin/settings", Component: AdminSettings },
      { path: "/admin/dashboard-overview", Component: AdminDashboardOverView },
      { path: "/admin/management", Component: AgentDashboardManagement },
      { path: "/admin/ticket/:id", Component: TicketDetails },
    ],
  },
  {
    path: "/agent",
    Component: Agent,
    children: [
      { index: true, Component: AgentDashboard },
      { path: "/agent/management", Component: AgentDashboardManagement },
      { path: "/agent/ticket/:id", Component: TicketDetails },
      { path: "/agent/management/:id", Component: TicketDetails },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedUnreadProvider>
          <RouterProvider router={router} />
        </AuthenticatedUnreadProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);