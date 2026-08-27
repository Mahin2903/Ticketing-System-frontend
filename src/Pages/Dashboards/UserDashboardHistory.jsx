// src/Pages/Dashboards/UserDashboardHistory.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Placeholder history — swap PLACEHOLDER_TICKETS with your real API call later
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";

// ── Badge style maps ──────────────────────────────────────────────────────────
const PRIORITY_STYLE = {
  Low:      { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  Medium:   { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  High:     { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  Critical: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const STATUS_STYLE = {
  "Open":        { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "In Progress": { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  "Pending":     { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  "Resolved":    { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  "Closed":      { color: "rgba(255,255,255,0.28)", bg: "rgba(255,255,255,0.06)" },
};

// ── Placeholder data — replace with real fetch later ─────────────────────────
const PLACEHOLDER_TICKETS = [
  {
    id: "TKT-001",
    subject: "Cannot connect to university Wi-Fi in Lab 3",
    priority: "High",
    status: "Resolved",
    department: "IT & Network Services",
    helpTopic: "Network & Internet Access",
    agent: "Md. Rafiqul Islam",
    createdAt: "2026-08-20T09:23:00Z",
    resolvedAt: "2026-08-20T11:45:00Z",
  },
  {
    id: "TKT-002",
    subject: "Projector not working in CSE Seminar Room",
    priority: "Medium",
    status: "In Progress",
    department: "Computer Science & Engineering",
    helpTopic: "Computer Hardware",
    agent: "Tanvir Ahmed",
    createdAt: "2026-08-22T14:10:00Z",
    resolvedAt: null,
  },
  {
    id: "TKT-003",
    subject: "University email account login failing",
    priority: "Critical",
    status: "Open",
    department: "Administration Office",
    helpTopic: "Account & Login Problem",
    agent: null,
    createdAt: "2026-08-25T08:00:00Z",
    resolvedAt: null,
  },
  {
    id: "TKT-004",
    subject: "2nd floor printer showing offline",
    priority: "Low",
    status: "Pending",
    department: "Library",
    helpTopic: "Printing & Scanning",
    agent: "Sadia Islam",
    createdAt: "2026-08-24T11:30:00Z",
    resolvedAt: null,
  },
  {
    id: "TKT-005",
    subject: "PABX extension 2240 unreachable from outside campus",
    priority: "Medium",
    status: "Resolved",
    department: "Finance & Accounts",
    helpTopic: "Phone & PABX",
    agent: "Md. Rafiqul Islam",
    createdAt: "2026-08-18T16:45:00Z",
    resolvedAt: "2026-08-19T10:20:00Z",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const calcResolution = (created, resolved) => {
  if (!resolved) return null;
  const ms = new Date(resolved) - new Date(created);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ label, styleMap }) => {
  const s = styleMap[label] ?? { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0"
      style={{ color: s.color, background: s.bg }}
    >
      {label}
    </span>
  );
};

// ── UserDashboardHistory ──────────────────────────────────────────────────────
const UserDashboardHistory = () => {
  // TODO: replace with real data
  // const [tickets, setTickets] = useState([]);
  // useEffect(() => { fetchTickets(user.uid).then(setTickets); }, []);

  return (
    <div className="max-w-3xl space-y-3">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-bold text-white/88">Ticket History</h2>
          <p className="text-[11.5px] text-white/32 mt-0.5">
            Showing placeholder data — connect your API to see real tickets
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] shrink-0">
          <span className="text-[10.5px] text-white/32">{PLACEHOLDER_TICKETS.length} tickets</span>
        </div>
      </div>

      {/* Ticket cards */}
      {PLACEHOLDER_TICKETS.map((ticket, i) => {
        const resolution = calcResolution(ticket.createdAt, ticket.resolvedAt);

        return (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 hover:border-white/[0.12] hover:bg-white/[0.05] transition-colors cursor-default"
          >
            {/* Top row: ID + badges + subject */}
            <div className="flex items-start gap-2 mb-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-white/25">{ticket.id}</span>
                  <Badge label={ticket.priority} styleMap={PRIORITY_STYLE} />
                  <Badge label={ticket.status} styleMap={STATUS_STYLE} />
                </div>
                <h3 className="text-[13.5px] font-semibold text-white/82 leading-snug">
                  {ticket.subject}
                </h3>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-white/32">
              <span>{ticket.department}</span>
              <span className="text-white/15">·</span>
              <span>{ticket.helpTopic}</span>
              <span className="text-white/15">·</span>
              <span>Opened {fmtDate(ticket.createdAt)}</span>

              {ticket.agent && (
                <>
                  <span className="text-white/15">·</span>
                  <span>
                    Agent:{" "}
                    <span className="text-white/50">{ticket.agent}</span>
                  </span>
                </>
              )}

              {!ticket.agent && ticket.status === "Open" && (
                <>
                  <span className="text-white/15">·</span>
                  <span className="text-amber-400/60">Awaiting assignment</span>
                </>
              )}

              {resolution && (
                <>
                  <span className="text-white/15">·</span>
                  <span className="text-emerald-400/65">Resolved in {resolution}</span>
                </>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Empty state (shown when real data is wired and returns nothing) */}
      {PLACEHOLDER_TICKETS.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </div>
          <p className="text-white/38 text-sm font-medium">No tickets yet</p>
          <p className="text-white/22 text-[12px] mt-1">Submit your first ticket and it will appear here</p>
        </div>
      )}
    </div>
  );
};

export default UserDashboardHistory;