import { StrictMode } from "react";
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
    ],
  },
  {
    path: "/admin",
    Component: Admin,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "/admin/settings", Component: AdminSettings },
    ],
  },
  {
    path: "/agent",
    Component: Agent,
    children: [
      { index: true, Component: AgentDashboard },
      { path: "/agent/management", Component: AgentDashboardManagement },
    ],
  },
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
