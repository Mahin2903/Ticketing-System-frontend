// src/Pages/Agent/AgentDashboardManagement.jsx
import { useState } from "react";
import { motion } from "framer-motion";

const LOGGED_IN_AGENT = "Tanvir Ahmed";

const AGENT_LIST = [
  "Tanvir Ahmed",
  "Md. Rafiqul Islam",
  "Sadia Islam",
  "Nusrat Jahan",
];

const INITIAL_UNASSIGNED_OR_ALL = [
  {
    id: "TKT-1001",
    subject: "Cannot connect to university Wi-Fi in Lab 3",
    department: "Computer Science & Engineering",
    priority: "High",
    agent: null,
  },
  {
    id: "TKT-1003",
    subject: "Mail quota exceeded on official inbox",
    department: "Administration Office",
    priority: "Critical",
    agent: null,
  },
  {
    id: "TKT-1004",
    subject: "Library card scanner driver corrupted",
    department: "Library",
    priority: "Low",
    agent: "Sadia Islam",
  },
];

const inputCls =
  "bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-1.5 text-white " +
  "text-[12px] focus:outline-none focus:border-violet-500/50 transition-colors";

const AgentDashboardManagement = () => {
  const [ticketList, setTicketList] = useState(INITIAL_UNASSIGNED_OR_ALL);

  const handleAssign = (ticketId, targetAgent) => {
    setTicketList((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, agent: targetAgent || null } : t))
    );
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-[16px] font-bold text-white/90">Task Delegation & Self-Assignment</h2>
        <p className="text-[12px] text-white/40 mt-0.5">
          Assign unassigned incoming tickets to yourself or reassign to team members based on workload.
        </p>
      </div>

      <div className="space-y-3">
        {ticketList.map((ticket, i) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] text-white/30">{ticket.id}</span>
                <span className="text-[11px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                  {ticket.priority}
                </span>
                <span className="text-[11.5px] text-white/35">{ticket.department}</span>
              </div>
              <h4 className="text-[13.5px] font-semibold text-white/90">{ticket.subject}</h4>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {ticket.agent !== LOGGED_IN_AGENT && (
                <button
                  onClick={() => handleAssign(ticket.id, LOGGED_IN_AGENT)}
                  className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/30 text-[11.5px] font-semibold transition-colors cursor-pointer"
                >
                  Assign to Me
                </button>
              )}

              <select
                value={ticket.agent || ""}
                onChange={(e) => handleAssign(ticket.id, e.target.value)}
                className={inputCls}
                style={{ colorScheme: "dark" }}
              >
                <option value="">-- Unassigned --</option>
                {AGENT_LIST.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent} {agent === LOGGED_IN_AGENT ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AgentDashboardManagement;