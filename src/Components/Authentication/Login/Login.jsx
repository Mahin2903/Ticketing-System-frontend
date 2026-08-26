// src/Components/Authentication/Login/Login.jsx

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router";
import { FcGoogle } from "react-icons/fc";
import Swal from "sweetalert2";
import uniImg from "../../../images/IMG_0794.png";
import UseAuth from "../../../Hooks/UseAuth";
import Logo from "../../../Utilities/Logo";

// ── animation variants ────────────────────────────────────────────────────────
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const imagePan = {
  hidden:  { opacity: 0, scale: 1.06 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } },
};

// ── component ─────────────────────────────────────────────────────────────────
const Login = () => {
  const { LoginWithGoogle, user, loading } = UseAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Redirect back to the page the user was trying to reach, or "/" by default
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleGoogleLogin = async () => {
    try {
      await LoginWithGoogle();
    } catch (err) {
      Swal.fire({
        icon:             "error",
        title:            "Sign-in failed",
        text:             err?.message || "Could not sign in with Google. Please try again.",
        background:       "#0f0b1a",
        color:            "#e2e8f0",
        confirmButtonColor: "#7c3aed",
        customClass:      { popup: "rounded-2xl border border-white/10" },
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-[#09090f] overflow-hidden">

      {/* ── Left panel: university image ──────────────────────────────────── */}
      <motion.div
        className="hidden lg:block relative w-[54%] overflow-hidden"
        variants={imagePan}
        initial="hidden"
        animate="visible"
      >
        <img
          src={uniImg}
          alt="JUST Campus"
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090f] via-[#09090f]/55 to-[#09090f]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-transparent to-[#09090f]/40" />

        {/* Ambient glows */}
        <motion.div
          className="absolute top-[22%] left-[38%] w-72 h-72 rounded-full bg-violet-700/25 blur-[90px] pointer-events-none"
          animate={{ scale: [1, 1.22, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[18%] right-[10%] w-56 h-56 rounded-full bg-amber-600/18 blur-[70px] pointer-events-none"
          animate={{ scale: [1.15, 1, 1.15], opacity: [0.22, 0.42, 0.22] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
        />

        {/* Text content */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-end px-14 pb-14"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="mb-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300/80 text-[11px] font-medium tracking-[0.18em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Official University Portal
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-[2.45rem] font-bold leading-[1.18] text-white mb-3.5"
          >
            Jashore University
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400">
              of Science &amp; Technology
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-white/40 text-[13.5px] leading-relaxed max-w-[300px] mb-9"
          >
            Submit and track support tickets through the official JUST portal — fast,
            transparent, and always on.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center gap-9">
            {[{ val: "24/7", label: "Support" }].map(({ val, label }) => (
              <div key={label}>
                <p className="text-[1.35rem] font-bold text-white leading-none">{val}</p>
                <p className="text-white/30 text-[11px] mt-1 tracking-wide">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Right panel: login card ───────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#09090f] via-[#0d0b1a] to-[#09090f]" />

        {/* Ambient glows */}
        <motion.div
          className="absolute top-[12%] right-[18%] w-[460px] h-[460px] rounded-full bg-violet-900/18 blur-[110px] pointer-events-none"
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[12%] left-[8%] w-60 h-60 rounded-full bg-amber-900/12 blur-[85px] pointer-events-none"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />

        <motion.div
          className="relative z-10 w-full max-w-[390px]"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-8">
            <div className="flex justify-center">
              <Logo />
            </div>
            <h1 className="text-[1.6rem] font-bold text-white tracking-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-white/40 text-sm">
              Sign in to the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 font-medium">
                JUST Ticketing Portal
              </span>
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={fadeUp}
            className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-2xl p-8"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.5), 0 0 80px rgba(109,40,217,0.07)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/[0.05] via-transparent to-amber-500/[0.03] pointer-events-none" />

            <div className="relative space-y-5">
              <p className="text-white/40 text-[13px] text-center">
                Use your JUST Google Workspace account
              </p>

              <motion.button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="relative w-full flex items-center justify-center gap-3 px-6 py-[14px] rounded-xl bg-white text-[#18182a] font-semibold text-[14px] overflow-hidden cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.014, y: -1 }}
                whileTap={{ scale: 0.975 }}
                transition={{ type: "spring", stiffness: 440, damping: 26 }}
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-white via-slate-50 to-white"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                />
                {loading ? (
                  <span className="relative w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <FcGoogle className="w-5 h-5 relative z-10 shrink-0" />
                    <span className="relative z-10">Continue with Google</span>
                  </>
                )}
              </motion.button>

              <div className="flex items-center gap-3 pt-0.5">
                <div className="flex-1 h-px bg-white/[0.07]" />
                <span className="text-white/20 text-[10.5px] tracking-widest uppercase">
                  Secured by Firebase
                </span>
                <div className="flex-1 h-px bg-white/[0.07]" />
              </div>

              <p className="text-[11px] text-white/20 text-center leading-relaxed">
                By signing in you agree to our{" "}
                <span className="text-violet-400/70 hover:text-violet-400 transition-colors duration-200 cursor-pointer">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-violet-400/70 hover:text-violet-400 transition-colors duration-200 cursor-pointer">
                  Privacy Policy
                </span>
              </p>
            </div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-center text-white/20 text-[11px] mt-5 tracking-wide"
          >
            Restricted to JUST students, faculty &amp; staff
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;