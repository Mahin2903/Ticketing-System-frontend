import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// ── Flow steps extracted from the activity diagram ────────────────────────────
const STEPS = [
  {
    id: 1,
    actor: 'You',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    ),
    label: 'Sign in',
    detail: 'Google OAuth with your varsity Gmail — no registration needed',
    color: '#a78bfa',
    glow:  'rgba(167,139,250,0.35)',
  },
  {
    id: 2,
    actor: 'You',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
    label: 'Submit a ticket',
    detail: 'Fill subject, priority, department, help topic, and a rich-text description',
    color: '#f472b6',
    glow:  'rgba(244,114,182,0.35)',
  },
  {
    id: 3,
    actor: 'System',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: 'ID + timer starts',
    detail: 'A unique Ticket ID and timestamp are generated; the resolution timer begins',
    color: '#fb923c',
    glow:  'rgba(251,146,60,0.35)',
  },
  {
    id: 4,
    actor: 'Agent',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Agent assigned',
    detail: 'Admin or Agent self-assigns or is assigned; you get notified instantly',
    color: '#34d399',
    glow:  'rgba(52,211,153,0.35)',
  },
  {
    id: 5,
    actor: 'Agent',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    label: 'Live status updates',
    detail: 'In Progress or Pending — timer pauses on Pending, resumes on In Progress',
    color: '#60a5fa',
    glow:  'rgba(96,165,250,0.35)',
  },
  {
    id: 6,
    actor: 'You',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    label: 'Resolved + feedback',
    detail: 'Resolution time is logged; you review the fix and leave feedback',
    color: '#a3e635',
    glow:  'rgba(163,230,53,0.35)',
  },
];

const Arrow = ({ color }) => (
  <div className="hidden md:flex items-center justify-center flex-shrink-0" style={{ width: 28 }}>
    <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
      <path d="M0 6 H22" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M20 2 L26 6 L20 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
);

const StepCard = ({ step, index, active, onClick }) => {
  const isActive = active === index;
  return (
    <motion.button
      onClick={() => onClick(index)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      className="relative flex flex-col items-center text-center cursor-pointer"
      style={{ minWidth: 90, maxWidth: 110, background: 'none', border: 'none', padding: 0 }}
      whileHover={{ y: -2 }}
    >
      <motion.div
        animate={{
          boxShadow: isActive
            ? `0 0 0 2px ${step.color}, 0 0 20px ${step.glow}`
            : `0 0 0 1px rgba(255,255,255,0.12)`,
          background: isActive
            ? `rgba(255,255,255,0.12)`
            : `rgba(255,255,255,0.06)`,
        }}
        transition={{ duration: 0.2 }}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive ? step.color : 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'color 0.2s',
          flexShrink: 0,
        }}
      >
        {step.icon}
      </motion.div>

      <div
        style={{
          position: 'absolute',
          top: -4,
          right: 'calc(50% - 34px)',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: isActive ? step.color : 'rgba(255,255,255,0.15)',
          color: isActive ? '#000' : 'rgba(255,255,255,0.5)',
          fontSize: 10,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        {step.id}
      </div>

      <p
        style={{
          marginTop: 10,
          fontSize: 11.5,
          fontWeight: 500,
          color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
          lineHeight: 1.3,
          transition: 'color 0.2s',
        }}
      >
        {step.label}
      </p>
    </motion.button>
  );
};

const Home = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const step = STEPS[activeStep];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">

      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute" style={{ top: '-10%', left: '-5%', width: '55%', height: '70%', background: 'radial-gradient(ellipse at 30% 20%, #b45309 0%, #92400e 25%, transparent 65%)', opacity: 0.75, transform: 'rotate(-20deg)', filter: 'blur(40px)' }} />
        <div className="absolute" style={{ bottom: '-5%', left: '20%', width: '60%', height: '60%', background: 'radial-gradient(ellipse at 50% 80%, #d946ef 0%, #c026d3 30%, #7e22ce 65%, transparent 85%)', opacity: 0.85, filter: 'blur(35px)' }} />
        <div className="absolute" style={{ top: '10%', right: '-10%', width: '50%', height: '70%', background: 'radial-gradient(ellipse at 70% 30%, #581c87 0%, #4c1d95 40%, transparent 70%)', opacity: 0.8, filter: 'blur(50px)' }} />
        <div className="absolute" style={{ top: '30%', left: '5%', width: '40%', height: '50%', background: 'radial-gradient(ellipse at 20% 60%, #9f1239 0%, #881337 40%, transparent 70%)', opacity: 0.6, filter: 'blur(45px)' }} />
      </div>

      {/* Giant bleed text */}
      <div className="absolute bottom-0 left-0 right-0 select-none pointer-events-none overflow-hidden" aria-hidden="true">
        <p style={{ fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif", fontWeight: 900, fontSize: 'clamp(100px, 18vw, 220px)', lineHeight: 0.85, letterSpacing: '-0.02em', color: '#000000', whiteSpace: 'nowrap', margin: 0, padding: '0 0.5rem', marginBottom: '-0.12em' }}>
          ICT PORTAL
        </p>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 w-full" style={{ maxWidth: 860, marginTop: '-5rem' }}>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a3e635', boxShadow: '0 0 6px #a3e635', flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            How it works
          </span>
        </motion.div>

        {/* Step row */}
        <div className="flex items-start justify-center flex-wrap md:flex-nowrap" style={{ gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-start">
              <StepCard step={s} index={i} active={activeStep} onClick={setActiveStep} />
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex items-center" style={{ marginTop: 26 }}>
                  <Arrow color={i === activeStep ? STEPS[i].color : 'rgba(255,255,255,0.12)'} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail card */}
        <div
          style={{
            width: '100%',
            maxWidth: 500,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${step.color}40`,
            boxShadow: `0 0 32px ${step.glow}`,
            overflow: 'hidden',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              style={{ padding: '18px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}
            >
              <div style={{ color: step.color, flexShrink: 0, marginTop: 1 }}>{step.icon}</div>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: step.color, opacity: 0.85 }}>
                  {step.actor}
                </span>
                <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{step.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{step.detail}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              key={`bar-${activeStep}`}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.8, ease: 'linear' }}
              style={{ height: '100%', background: step.color, borderRadius: 1 }}
            />
          </div>
        </div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => navigate('/tickets/new')}
            style={{ padding: '11px 28px', borderRadius: 9999, background: '#fff', color: '#0a0814', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '0.01em', transition: 'opacity 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Submit a ticket
          </button>
          <button
            onClick={() => navigate('/tickets')}
            style={{ padding: '10px 24px', borderRadius: 9999, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 500, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
          >
            View my tickets
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;