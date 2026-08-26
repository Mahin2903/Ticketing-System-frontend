// src/Components/Home/Home.jsx
// ─────────────────────────────────────────────────────────────────────────────
// JUST ICT Ticketing Portal — Home Page
// Lenis smooth scroll · GSAP ScrollTrigger section-header reveal
// Framer Motion hero stagger · step card whileInView + whileHover
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import uniImg from "../images/IMG_0794.png";
import Logo from "../Utilities/Logo";
// import Logo from "../../Utilities/Logo";

gsap.registerPlugin(ScrollTrigger);

// ── Framer Motion variants ────────────────────────────────────────────────────
const heroStagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] } },
};

const imagePan = {
  hidden: { opacity: 0, scale: 1.05 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] } },
};

// ── Static data ───────────────────────────────────────────────────────────────
const STATS = [
  { value: "500+", label: "Tickets resolved" },
  { value: "< 2h",  label: "Avg. first response" },
  { value: "98%",  label: "Resolution rate" },
];

const STEPS = [
  {
    id: "01",
    label: "Sign in",
    detail: "Authenticate with your JUST Google Workspace account — no separate registration needed.",
    color: "#a78bfa",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    ),
  },
  {
    id: "02",
    label: "Submit a ticket",
    detail: "Fill in subject, priority, department, help topic, and a rich-text description of your issue.",
    color: "#f472b6",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    id: "03",
    label: "ID & timer assigned",
    detail: "A unique ticket ID and timestamp are generated instantly. Your resolution timer begins.",
    color: "#fb923c",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    id: "04",
    label: "Agent assigned",
    detail: "An ICT support agent claims your ticket. You receive an instant notification.",
    color: "#34d399",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: "05",
    label: "Live status updates",
    detail: "Track progress in real time — In Progress or Pending, with live timer data throughout.",
    color: "#60a5fa",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: "06",
    label: "Resolved & feedback",
    detail: "Resolution time is logged. Review the fix, close the ticket, and leave your feedback.",
    color: "#a3e635",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
];

// ── Inline arrow icon ─────────────────────────────────────────────────────────
const ArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
  </svg>
);

// ── StepCard — Framer Motion whileInView + whileHover ────────────────────────
const StepCard = ({ step, index }) => (
  <motion.div
    className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 overflow-hidden cursor-default"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{
      duration: 0.65,
      delay: (index % 3) * 0.08,
      ease: [0.22, 1, 0.36, 1],
    }}
    whileHover={{ y: -4, borderColor: `${step.color}38` }}
  >
    {/* Hover glow — CSS transition, no Framer conflict */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: `radial-gradient(ellipse at top left, ${step.color}12 0%, transparent 65%)` }}
    />

    {/* Number + Icon */}
    <div className="relative flex items-start justify-between mb-5">
      <span
        className="text-[10.5px] font-bold tracking-[0.22em] uppercase"
        style={{ color: step.color, opacity: 0.85 }}
      >
        {step.id}
      </span>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${step.color}18`, color: step.color }}
      >
        {step.icon}
      </div>
    </div>

    {/* Text */}
    <h3 className="relative text-[14.5px] font-semibold text-white leading-snug mb-2">
      {step.label}
    </h3>
    <p className="relative text-[13px] text-white/40 leading-relaxed">
      {step.detail}
    </p>
  </motion.div>
);

// ── Home ──────────────────────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate();
  const sectionHeaderRef = useRef(null);

  // ── Lenis smooth scroll + GSAP ticker integration ──────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, []);

  // ── GSAP ScrollTrigger: "How it works" header stagger reveal ──────────────
  useEffect(() => {
    if (!sectionHeaderRef.current) return;

    const targets = sectionHeaderRef.current.children;
    gsap.set(targets, { opacity: 0, y: 20 });

    const trigger = ScrollTrigger.create({
      trigger: sectionHeaderRef.current,
      start: "top 82%",
      onEnter: () =>
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.1,
          ease: "power3.out",
        }),
    });

    return () => trigger.kill();
  }, []);

  return (
    <main className="bg-[#09090f] overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="min-h-screen flex overflow-hidden">

        {/* ── Left: content panel ──────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-14 xl:p-20 relative">

          {/* Ambient glows */}
          <motion.div
            className="absolute top-[8%] left-[2%] w-[440px] h-[440px] rounded-full bg-violet-900/[0.18] blur-[110px] pointer-events-none"
            animate={{ scale: [1, 1.16, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[12%] right-[5%] w-60 h-60 rounded-full bg-amber-800/[0.13] blur-[80px] pointer-events-none"
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-[500px]"
            variants={heroStagger}
            initial="hidden"
            animate="visible"
          >
            {/* Logo */}
            <motion.div variants={fadeUp} className="mb-9">
              <Logo />
            </motion.div>

            {/* Eyebrow badge */}
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300/80 text-[11px] font-medium tracking-[0.18em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Official ICT Support System
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-bold leading-[1.1] tracking-tight text-white mb-5"
              style={{ fontSize: "clamp(2.1rem, 4vw, 3.3rem)" }}
            >
              Submit. Track.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400">
                Get resolved.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              className="text-white/40 text-[15px] leading-[1.72] mb-9 max-w-[390px]"
            >
              The official support portal for Jashore University of Science &amp; Technology —
              fast, transparent, and available around the clock.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-11">
              <motion.button
                onClick={() => navigate("/tickets/new")}
                className="flex items-center gap-2.5 px-7 py-[14px] rounded-xl bg-white text-[#18182a] font-semibold text-sm cursor-pointer select-none"
                whileHover={{ scale: 1.016, y: -1.5 }}
                whileTap={{ scale: 0.975 }}
                transition={{ type: "spring", stiffness: 440, damping: 26 }}
              >
                Submit a ticket
                <ArrowRight />
              </motion.button>

              <motion.button
                onClick={() => navigate("/tickets")}
                className="px-7 py-[13px] rounded-xl border border-white/[0.12] bg-white/[0.04] text-white/65 font-medium text-sm cursor-pointer select-none backdrop-blur-sm"
                whileHover={{ scale: 1.016, y: -1.5 }}
                whileTap={{ scale: 0.975 }}
                transition={{ type: "spring", stiffness: 440, damping: 26 }}
              >
                View my tickets
              </motion.button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-8 pt-7 border-t border-white/[0.07]"
            >
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-[1.45rem] font-bold text-white leading-none tracking-tight">
                    {value}
                  </p>
                  <p className="text-white/30 text-[11px] mt-1.5 tracking-wide">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* ── Right: campus image panel ─────────────────────────────────── */}
        <motion.div
          className="hidden lg:block relative w-[46%] overflow-hidden"
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090f] via-[#09090f]/50 to-[#09090f]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090f] via-transparent to-[#09090f]/38" />

          {/* Ambient glows */}
          <motion.div
            className="absolute top-[22%] left-[32%] w-72 h-72 rounded-full bg-violet-700/[0.24] blur-[90px] pointer-events-none"
            animate={{ scale: [1, 1.22, 1], opacity: [0.28, 0.5, 0.28] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[20%] right-[10%] w-52 h-52 rounded-full bg-amber-600/[0.18] blur-[70px] pointer-events-none"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.18, 0.38, 0.18] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
          />

          {/* Floating system-status badge */}
          <motion.div
            className="absolute bottom-10 right-8 rounded-2xl border border-white/[0.09] bg-black/45 backdrop-blur-xl p-5"
            initial={{ opacity: 0, y: 16, x: 8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-white/45 text-[10px] tracking-[0.16em] uppercase font-medium">
                System live
              </span>
            </div>
            <p className="text-white font-bold text-[1.05rem] leading-none">24 / 7</p>
            <p className="text-white/30 text-[11px] mt-1.5">Support availability</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 lg:px-12 relative">

        {/* Hairline separator */}
        <div className="absolute top-0 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="max-w-5xl mx-auto">

          {/* Section header — children animated by GSAP ScrollTrigger */}
          <div className="text-center mb-14" ref={sectionHeaderRef}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300/80 text-[11px] font-medium tracking-[0.18em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              How it works
            </span>
            <h2 className="text-[2rem] font-bold text-white tracking-tight leading-tight mt-4 mb-3">
              From issue to resolution
            </h2>
            <p className="text-white/35 text-[13.5px] max-w-xs mx-auto leading-relaxed">
              Six transparent steps — so you always know exactly where your ticket stands.
            </p>
          </div>

          {/* Steps grid — each card uses Framer Motion whileInView */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {STEPS.map((step, i) => (
              <StepCard key={step.id} step={step} index={i} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-14">
            <motion.button
              onClick={() => navigate("/tickets/new")}
              className="inline-flex items-center gap-2.5 px-8 py-[15px] rounded-2xl bg-white text-[#18182a] font-semibold text-sm cursor-pointer select-none"
              whileHover={{ scale: 1.016, y: -2 }}
              whileTap={{ scale: 0.975 }}
              transition={{ type: "spring", stiffness: 440, damping: 26 }}
            >
              Ready? Submit your first ticket
              <ArrowRight />
            </motion.button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;