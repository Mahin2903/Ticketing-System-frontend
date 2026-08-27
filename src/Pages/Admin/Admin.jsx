// src/Pages/Admin/Admin.jsx
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import UseAuth from "../../Hooks/UseAuth";
import Logo from "../../Utilities/Logo";

const ADMIN_NAV_ITEMS = [
  {
    to: "/admin",
    label: "Tickets Management",
    exact: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    to: "/admin/settings",
    label: "System Settings",
    exact: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const AdminSidebar = ({ collapsed, onToggle, forceExpanded, onNavClick, user, onLogout }) => {
  const { pathname } = useLocation();
  const isActive = ({ to, exact }) => exact ? pathname === to : pathname.startsWith(to);
  const open = forceExpanded || !collapsed;

  return (
    <div className="flex flex-col h-full">
      <Link
        to="/"
        className={`flex items-center px-4 py-[18px] border-b border-white/[0.06] ${
          open ? "justify-between" : "justify-center"
        }`}
      >
        {open && (
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Admin
            </span>
          </div>
        )}
        {!forceExpanded && (
          <button
            onClick={onToggle}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/65 hover:bg-white/[0.06] transition-colors shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
            </svg>
          </button>
        )}
      </Link>

      <nav className="flex-1 px-2.5 py-3 space-y-0.5">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavClick}
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
              <p className="text-[12px] font-semibold text-white/80 truncate">
                {user?.displayName ?? "Admin"}
              </p>
              <p className="text-[10.5px] text-white/32 truncate">
                {user?.email ?? "—"}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="shrink-0 text-white/28 hover:text-white/60 transition-colors p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Admin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, LogOut } = UseAuth();
  const { pathname } = useLocation();

  const currentLabel =
    ADMIN_NAV_ITEMS.find(({ to, exact }) =>
      exact ? pathname === to : pathname.startsWith(to)
    )?.label ?? "Admin";

  const sidebarProps = {
    user,
    onLogout: LogOut,
    onNavClick: () => setMobileOpen(false),
  };

  return (
    <div className="min-h-screen bg-[#09090f] flex text-white">
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

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-60 bg-[#0a0915] border-r border-white/[0.06] lg:hidden"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AdminSidebar {...sidebarProps} collapsed={false} onToggle={() => {}} forceExpanded />
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.aside
        className="hidden lg:block shrink-0 bg-[#0a0915] border-r border-white/[0.06] overflow-hidden"
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <AdminSidebar
          {...sidebarProps}
          collapsed={collapsed}
          onToggle={() => setCollapsed((p) => !p)}
          forceExpanded={false}
        />
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-5 h-[54px] bg-[#09090f]/95 backdrop-blur-xl border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h1 className="flex-1 text-[13px] font-semibold text-white/65 tracking-wide">
            {currentLabel}
          </h1>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[10.5px] text-violet-300 font-medium tracking-wide">
              Admin Mode
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Admin;