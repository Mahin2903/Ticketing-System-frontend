

import { motion } from "framer-motion";

const DOT = () => (
  <span className="relative flex h-2 w-2 shrink-0">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
  </span>
);

/**
 * UnreadBadge
 *
 * @param {{ count: number, variant?: "compact" | "full", className?: string }} props
 */
export const UnreadBadge = ({ count = 0, variant = "compact", className = "" }) => {
  if (!count) return null;

  if (variant === "full") {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
          bg-violet-500/15 border border-violet-500/30 text-violet-300
          text-[11px] font-semibold whitespace-nowrap ${className}`}
      >
        <DOT />
        {count === 1 ? "1 new reply" : `${count} new replies`}
      </motion.span>
    );
  }

  // compact: just a pill
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
        bg-violet-500 text-white text-[9.5px] font-bold leading-none
        shadow-md shadow-violet-500/30 ${className}`}
    >
      {count > 9 ? "9+" : count}
    </motion.span>
  );
};

/**
 * UnreadRowIndicator
 * Wraps a ticket-list row child and applies the "unread" visual treatment:
 *  • left accent bar
 *  • subject text appears bolder / brighter
 *
 * Usage: wrap the motion.div / div of each ticket row.
 */
export const UnreadRowIndicator = ({ hasUnread, children }) => {
  if (!hasUnread) return children;

  return (
    <div className="relative">
      {/* Left accent stripe */}
      <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
      {children}
    </div>
  );
};

/**
 * ActionRequiredChip
 * A prominent "Action Required" indicator for the ticket subject line area.
 */
export const ActionRequiredChip = ({ count }) => {
  if (!count) return null;
  return (
    <motion.span
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
        bg-violet-600/20 border border-violet-500/35 text-violet-300
        text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400" />
      </span>
      {count === 1 ? "1 new reply" : `${count} new`}
    </motion.span>
  );
};