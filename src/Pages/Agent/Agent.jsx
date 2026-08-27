// src/Pages/Agent/Agent.jsx
import { Link, NavLink, Outlet } from "react-router";
import Logo from "../../Utilities/Logo";

const Agent = () => {
  return (
    <div className="min-h-screen bg-[#09090f] text-white p-4 sm:p-8 space-y-6">
      {/* ── Top Navigation Tabs ── */}
      <Link to='/' className={`flex items-center px-4 py-[18px] border-b border-white/[0.06] justify-center`}>
        <Logo></Logo>
      </Link>
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <NavLink
          to="/agent"
          end
          className={({ isActive }) =>
            `px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
            }`
          }
        >
          My Active Tasks
        </NavLink>

        <NavLink
          to="/agent/management"
          className={({ isActive }) =>
            `px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
            }`
          }
        >
          Task Assignment & Delegation
        </NavLink>
      </div>

      {/* ── Sub-route Target ── */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Agent;