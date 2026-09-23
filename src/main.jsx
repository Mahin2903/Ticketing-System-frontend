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
import PrivateRoute from "./Components/Authentication/PrivateRoute.jsx";

const queryClient = new QueryClient();

// ── Wrapper component to inject DB User ID into UnreadProvider ────────────────
export const AuthenticatedUnreadProvider = ({ children }) => {
  const { user, dbUser } = UseAuth();
  const [dbUserId, setDbUserId] = useState(null);

  useEffect(() => {
    if (dbUser?.id) {
      setDbUserId(dbUser.id);
      return;
    }

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
  }, [user?.email, dbUser?.id]);

  return (
    <UnreadProvider currentUserId={dbUser?.id || dbUserId}>
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
    element: (
      <PrivateRoute allowedRoles={["user"]}>
        <Dashboard />
      </PrivateRoute>
    ),
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
    element: (
      <PrivateRoute allowedRoles={["admin", "super_admin"]}>
        <Admin />
      </PrivateRoute>
    ),
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
    element: (
      <PrivateRoute allowedRoles={["agent", "admin", "super_admin"]}>
        <Agent />
      </PrivateRoute>
    ),
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