// src/Components/PrivateRoute.jsx

import { Navigate, useLocation } from "react-router";
import UseAuth from "../Hooks/UseAuth";   // adjust path if needed


const PrivateRoute = ({ children }) => {
  const { user, loading } = UseAuth();
  const location = useLocation();

  // While Firebase is restoring the session, show a blank dark screen
  // (swap for a spinner component if you have one)
  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#09090f] flex items-center justify-center"
        aria-label="Loading…"
      >
        <span className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  return children;
};

export default PrivateRoute;