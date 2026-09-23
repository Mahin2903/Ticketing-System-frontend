// src/Components/Authentication/PrivateRoute.jsx

import { Navigate, Outlet, useLocation } from "react-router";
import UseAuth from "../../Hooks/UseAuth";
import { isValidJustEmail } from "../../Utilities/auth.utils";

const normalizeRole = (role) => {
  if (!role || typeof role !== "string") return "user";
  return role.trim().toLowerCase().replace(/[\s-]+/g, "_");
};

/**
 * Route protection guard:
 * - Redirects unauthenticated / unauthorized users.
 * - Enforces role-based permissions:
 *   - "user": only user can access user's route (/dashboard/*)
 *   - "agent": agent can access agent's route (/agent/*)
 *   - "admin" / "super_admin": admin can access admin's (/admin/*) and agent's (/agent/*)
 */
const PrivateRoute = ({ allowedRoles = [], children }) => {
  const { user, role, loading } = UseAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#09090f] flex items-center justify-center"
        aria-label="Loading…"
      >
        <span className="w-7 h-7 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Not authenticated or invalid JUST email
  if (!user || !isValidJustEmail(user.email)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = normalizeRole(role);
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

  // 2. Role-based access control
  if (allowedRoles.length > 0 && !normalizedAllowed.includes(userRole)) {
    // Redirect unauthorized user to their designated dashboard
    if (userRole === "admin" || userRole === "super_admin") {
      return <Navigate to="/admin" replace />;
    } else if (userRole === "agent") {
      return <Navigate to="/agent" replace />;
    } else {
      return <Navigate to="/dashboard/user-dashboard-history" replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default PrivateRoute;