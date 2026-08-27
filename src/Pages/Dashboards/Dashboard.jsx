// src/Pages/Dashboards/Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// No DaisyUI — fully custom sidebar matching the portal design system
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import UseAuth from "../../Hooks/UseAuth";
import Logo from "../../Utilities/Logo";

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Create Ticket",
    exact: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    to: "/dashboard/user-dashboard-history",
    label: "My Tickets",
    exact: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
  },
];
// const {user} = UseAuth();

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle, forceExpanded, onNavClick, user, onLogout }) => {
  const { pathname } = useLocation();

  const isActive = ({ to, exact }) =>
    exact ? pathname === to : pathname.startsWith(to);

  const open = forceExpanded || !collapsed;

  return (
    <div className="flex flex-col h-full">

      {/* Logo row */}
      <Link to='/' className={`flex items-center px-4 py-[18px] border-b border-white/[0.06] ${open ? "justify-between" : "justify-center"}`}>
        {open && <Logo />}
        {!forceExpanded && (
          <button
            onClick={onToggle}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/65 hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed
                ? <path d="M9 18l6-6-6-6"/>
                : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavClick}
              title={!open ? item.label : undefined}
              className={`relative flex items-center gap-3 px-3 py-[10px] rounded-xl text-[13px] font-medium transition-colors ${
                active
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-white/40 hover:text-white/72 hover:bg-white/[0.05]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-[18px] bg-violet-400 rounded-full" />
              )}
              <span className={`shrink-0 ${active ? "text-violet-400" : ""}`}>
                {item.icon}
              </span>
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`px-3 py-3.5 border-t border-white/[0.06] ${!open ? "flex justify-center" : ""}`}>
        {!open ? (
          <img
            src={user?.photoURL ?? ""}
            alt=""
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <img
              src={user?.photoURL ?? ""}
              alt=""
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white/80 truncate">{user?.displayName ?? "—"}</p>
              <p className="text-[10.5px] text-white/32 truncate">{user?.email ?? "—"}</p>
            </div>
            {/* Sign-out — ensure your UseAuth hook exposes a logout function */}
            <button
              onClick={onLogout}
              title="Sign out"
              className="shrink-0 text-white/28 hover:text-white/60 transition-colors p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, LogOut } = UseAuth(); // make sure LogOut is exported from your auth context
  const { pathname } = useLocation();

  const currentLabel =
    NAV_ITEMS.find(({ to, exact }) => (exact ? pathname === to : pathname.startsWith(to)))?.label
    ?? "Dashboard";

  const sidebarProps = {
    user,
    onLogout: LogOut,
    onNavClick: () => setMobileOpen(false),
  };

  console.log("Current user in Dashboard:", user); // Debugging line to check user state

  return (
    <div className="min-h-screen bg-[#09090f] flex text-white">

      {/* ── Mobile backdrop ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile sidebar (overlay) ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-60 bg-[#0a0915] border-r border-white/[0.06] lg:hidden"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Sidebar {...sidebarProps} collapsed={false} onToggle={() => {}} forceExpanded />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar (persistent, collapsible) ────────────────────── */}
      <motion.aside
        className="hidden lg:block shrink-0 bg-[#0a0915] border-r border-white/[0.06] overflow-hidden"
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Sidebar
          {...sidebarProps}
          collapsed={collapsed}
          onToggle={() => setCollapsed((p) => !p)}
          forceExpanded={false}
        />
      </motion.aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Navbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-5 h-[54px] bg-[#09090f]/95 backdrop-blur-xl border-b border-white/[0.06] shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            aria-label="Open navigation"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <h1 className="flex-1 text-[13px] font-semibold text-white/65 tracking-wide">
            {currentLabel}
          </h1>

          {/* System live badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10.5px] text-white/38 font-medium tracking-wide">Live</span>
          </div>
        </header>

        {/* Routed page content */}
        <main className="flex-1 overflow-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;