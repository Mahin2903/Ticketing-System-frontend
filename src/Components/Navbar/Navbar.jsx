import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../Utilities/Logo";
import { LuLogIn } from "react-icons/lu";

// ── nav links (adjust hrefs to your router) ──────────────────────────────────
const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Tickets", to: "/tickets" },
  { label: "My Tickets", to: "/my-tickets" },
];

// ── tiny helpers ──────────────────────────────────────────────────────────────
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

// ── active link style ─────────────────────────────────────────────────────────
const linkClass = ({ isActive }) =>
  [
    "relative px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-150",
    isActive ? "text-white" : "text-white/60 hover:text-white/90",
  ].join(" ");

// ─────────────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // scroll detection — thicken/thin the glass
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  // close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {/* ── MAIN NAV BAR ──────────────────────────────────────────────────── */}
      <motion.nav
        ref={menuRef}
        initial={false}
        animate={{
          paddingTop: scrolled ? "8px" : "14px",
          paddingBottom: scrolled ? "8px" : "14px",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          // liquid glass base
          background: scrolled ? "rgba(10,8,20,0.55)" : "rgba(10,8,20,0.25)",
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          // subtle inner light — the "liquid" shimmer
          boxShadow: scrolled
            ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)"
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
        }}
        className="px-5 md:px-8 lg:px-12"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <NavLink
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            {/* Glyph mark */}
            <Logo></Logo>
          </NavLink>

          {/* ── Desktop links ─────────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div key={link.to} className="relative">
                <NavLink to={link.to} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      {/* active pill background */}
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "rgba(255,255,255,0.12)",
                            border: "1px solid rgba(255,255,255,0.15)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </>
                  )}
                </NavLink>
              </div>
            ))}
          </div>

          {/* ── Desktop right actions ──────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-3">
            {/* New Ticket CTA */}
            <Link
              to="/login"
              onClick={() => navigate("/tickets/new")}
              className="flex bg-gradient-to-r from-orange-400 to-pink-600 items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition-opacity duration-150 hover:opacity-85 active:scale-95"
              style={{
                color: "#fff",
                boxShadow: "0 0 16px rgba(147,51,234,0.3)",
              }}
            >
              <LuLogIn />
              Login
            </Link>

            {/* User avatar placeholder */}
            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
              title="Profile"
            >
              U
            </button>
          </div>

          {/* ── Mobile hamburger ──────────────────────────────────────────── */}
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full transition-colors"
            style={{
              background: mobileOpen ? "rgba(255,255,255,0.12)" : "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>

        {/* ── Mobile dropdown ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden lg:hidden"
            >
              <div
                className="max-w-7xl mx-auto mt-3 pb-4 flex flex-col gap-1"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "12px",
                }}
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
                            : "text-white/60 hover:text-white hover:bg-white/06",
                        ].join(" ")
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}

                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: NAV_LINKS.length * 0.05,
                    duration: 0.18,
                  }}
                  className="mt-2 flex gap-2"
                >
                  <Link
                    to="/login"
                    onClick={() => {
                      navigate("/tickets/new");
                      setMobileOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
                    style={{
                      boxShadow: "0 0 16px rgba(147,51,234,0.25)",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Login
                  </Link>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setMobileOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/08 transition-colors border border-white/12"
                  >
                    Profile
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Spacer so page content isn't hidden under fixed nav ────────────── */}
      <div className="h-[62px]" aria-hidden="true" />
    </>
  );
};

export default Navbar;
