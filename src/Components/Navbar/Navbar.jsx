import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../Utilities/Logo";
import { LuLogIn, LuLogOut } from "react-icons/lu";
import UseAuth from "../../Hooks/UseAuth";

// ── nav links ──────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Home",       to: "/" },
  // { label: "Tickets",    to: "/tickets" },
  { label: "My Tickets", to: "/dashboard" },
  { label: "Admin Panel", to: "/admin" },
  { label: "Admin Panel", to: "/agent" },
];

// ── helpers ────────────────────────────────────────────────────────────────────
const HamburgerIcon = ({ open }) => (
  <span className="flex flex-col justify-center items-center w-5 h-5 gap-[5px]">
    <motion.span
      className="block h-[1.5px] w-5 bg-white origin-center rounded-full"
      animate={open ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.2 }}
    />
    <motion.span
      className="block h-[1.5px] w-5 bg-white rounded-full"
      animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.15 }}
    />
    <motion.span
      className="block h-[1.5px] w-5 bg-white origin-center rounded-full"
      animate={open ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.2 }}
    />
  </span>
);

const linkClass = ({ isActive }) =>
  [
    "relative px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-150",
    isActive ? "text-white" : "text-white/60 hover:text-white/90",
  ].join(" ");

// ── component ──────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);

  const navigate   = useNavigate();
  const menuRef    = useRef(null);
  const profileRef = useRef(null);

  const { user, LogOut } = UseAuth();

  // ── scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── close mobile menu on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMobileOpen(false);
    };
    if (mobileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  // ── close profile dropdown on outside click ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    if (profileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // ── close mobile menu on resize to desktop ────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogOut = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    await LogOut();
    navigate("/login");
  };

  return (
    <>
      {/* ── MAIN NAV BAR ──────────────────────────────────────────────────── */}
      <motion.nav
        ref={menuRef}
        initial={false}
        animate={{
          paddingTop:    scrolled ? "8px"  : "14px",
          paddingBottom: scrolled ? "8px"  : "14px",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position:            "fixed",
          top: 0, left: 0, right: 0,
          zIndex:              50,
          background:          scrolled ? "rgba(10,8,20,0.55)" : "rgba(10,8,20,0.25)",
          backdropFilter:      "blur(24px) saturate(1.6)",
          WebkitBackdropFilter:"blur(24px) saturate(1.6)",
          borderBottom:        "1px solid rgba(255,255,255,0.08)",
          boxShadow:           scrolled
            ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)"
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
        }}
        className="px-5 md:px-8 lg:px-12"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* ── Logo ────────────────────────────────────────────────────── */}
          <NavLink
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <Logo />
          </NavLink>

          {/* ── Desktop links ──────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div key={link.to} className="relative">
                <NavLink to={link.to} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "rgba(255,255,255,0.12)",
                            border:     "1px solid rgba(255,255,255,0.15)",
                          }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </>
                  )}
                </NavLink>
              </div>
            ))}
          </div>

          {/* ── Desktop right actions ──────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              /* ── Authenticated: avatar + dropdown ── */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-8 h-8 rounded-full overflow-hidden transition-all duration-200 cursor-pointer"
                  style={{
                    boxShadow: profileOpen
                      ? "0 0 0 2px rgba(139,92,246,0.8)"
                      : "0 0 0 1.5px rgba(255,255,255,0.2)",
                  }}
                  title={user.displayName ?? "Profile"}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? "avatar"}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span
                      className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#6366f1 0%,#a855f7 100%)" }}
                    >
                      {user.displayName?.[0] ?? "U"}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{   opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-11 w-60 rounded-2xl border border-white/10 overflow-hidden"
                      style={{
                        background:     "rgba(13,11,26,0.96)",
                        backdropFilter: "blur(24px)",
                        boxShadow:
                          "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3.5 flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/15"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span
                            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white ring-1 ring-white/15"
                            style={{ background: "linear-gradient(135deg,#6366f1 0%,#a855f7 100%)" }}
                          >
                            {user.displayName?.[0] ?? "U"}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-white text-[13px] font-medium truncate leading-tight">
                            {user.displayName}
                          </p>
                          <p className="text-white/40 text-[11px] truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="h-px bg-white/[0.07] mx-3" />

                      <div className="p-2">
                        <button
                          onClick={handleLogOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
                        >
                          <LuLogOut className="w-3.5 h-3.5 shrink-0" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* ── Unauthenticated: Login button ── */
              <Link
                to="/login"
                className="flex bg-gradient-to-r from-orange-400 to-pink-600 items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition-opacity duration-150 hover:opacity-85 active:scale-95"
                style={{ color: "#fff", boxShadow: "0 0 16px rgba(147,51,234,0.3)" }}
              >
                <LuLogIn />
                Login
              </Link>
            )}
          </div>

          {/* ── Mobile hamburger ───────────────────────────────────────── */}
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full transition-colors"
            style={{
              background: mobileOpen ? "rgba(255,255,255,0.12)" : "transparent",
              border:     "1px solid rgba(255,255,255,0.12)",
            }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>

        {/* ── Mobile dropdown ───────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{   opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden lg:hidden"
            >
              <div
                className="max-w-7xl mx-auto mt-3 pb-4 flex flex-col gap-1"
                style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}
              >
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.18 }}
                  >
                    <NavLink
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        [
                          "block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                          isActive
                            ? "bg-white/10 text-white border border-white/15"
                            : "text-white/60 hover:text-white hover:bg-white/[0.06]",
                        ].join(" ")
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}

                {/* ── Mobile auth section ─────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: NAV_LINKS.length * 0.05, duration: 0.18 }}
                  className="mt-2"
                >
                  {user ? (
                    <div className="flex flex-col gap-2">
                      {/* User info row */}
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/15"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span
                            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/15"
                            style={{ background: "linear-gradient(135deg,#6366f1 0%,#a855f7 100%)" }}
                          >
                            {user.displayName?.[0] ?? "U"}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate leading-tight">
                            {user.displayName}
                          </p>
                          <p className="text-white/40 text-[11px] truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Sign out */}
                      <button
                        onClick={handleLogOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
                      >
                        <LuLogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-400/20 to-pink-600/20 border border-white/10 transition-opacity hover:opacity-85"
                    >
                      <LuLogIn className="w-4 h-4" />
                      Login
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Spacer ──────────────────────────────────────────────────────────── */}
      <div className="h-[62px]" aria-hidden="true" />
    </>
  );
};

export default Navbar;