// src/Pages/Admin/AdminDashboard.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Style Maps ───────────────────────────────────────────────────────────────
const PRIORITY_STYLE = {
  Low: { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  Medium: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  High: { color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  Critical: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const STATUS_STYLE = {
  Open: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "In Progress": { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  Pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  Resolved: { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  Cancelled: { color: "rgba(255,255,255,0.32)", bg: "rgba(255,255,255,0.06)" },
};

// ── Dummy Agents & Tickets ───────────────────────────────────────────────────
const AGENTS = [
  "Unassigned",
  "Md. Rafiqul Islam",
  "Tanvir Ahmed",
  "Sadia Islam",
  "Nusrat Jahan",
];

const INITIAL_TICKETS = [
  {
    id: "TKT-1001",
    subject: "Cannot connect to university Wi-Fi in Lab 3",
    priority: "High",
    status: "Open",
    department: "IT & Network Services",
    helpTopic: "Network & Internet Access",
    agent: null,
    submittedBy: { name: "Abir Hossain", email: "abir@univ.edu" },
    room: "Lab-302",
    mobile: "01711223344",
    createdAt: "2026-08-25T10:15:00Z",
    descriptionPlain:
      "Wi-Fi keeps dropping every 5 minutes when connected to campus network inside CSE Lab 3.",
  },
  {
    id: "TKT-1002",
    subject: "Projector flickering in Seminar Room",
    priority: "Medium",
    status: "In Progress",
    department: "Computer Science & Engineering",
    helpTopic: "Computer Hardware",
    agent: "Tanvir Ahmed",
    submittedBy: { name: "Dr. Farhana Khan", email: "farhana@univ.edu" },
    room: "Seminar-01",
    mobile: "01811998877",
    createdAt: "2026-08-26T08:30:00Z",
    descriptionPlain:
      "HDMI connection to the ceiling projector flickers green during presentations.",
  },
  {
    id: "TKT-1003",
    subject: "Faculty email password reset request",
    priority: "Critical",
    status: "Pending",
    department: "Administration Office",
    helpTopic: "Account & Login Problem",
    agent: "Md. Rafiqul Islam",
    submittedBy: { name: "Prof. Tariqul Islam", email: "tariq@univ.edu" },
    room: "Admin-104",
    mobile: "01911334455",
    createdAt: "2026-08-27T07:45:00Z",
    descriptionPlain:
      "Locked out of official account after 3 incorrect attempts. Urgent access required.",
  },
];

const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3.5 py-2 text-white " +
  "text-[12.5px] focus:outline-none focus:border-violet-500/50 transition-colors";

const AdminDashboard = () => {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [filterStatus, setFilterStatus] = useState("All");
  const [editingTicket, setEditingTicket] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Quick Inline Status Update
  const updateTicketStatus = (id, status) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  // Assign Agent
  const assignAgent = (id, agent) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, agent: agent === "Unassigned" ? null : agent } : t
      )
    );
  };

  // Delete Ticket
  const handleDelete = (id) => {
    if (confirm(`Delete ticket ${id}?`)) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Save Modal Edits
  const handleSaveEdit = (e) => {
    e.preventDefault();
    setTickets((prev) =>
      prev.map((t) => (t.id === editingTicket.id ? editingTicket : t))
    );
    setEditingTicket(null);
  };

  const filteredTickets =
    filterStatus === "All"
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  return (
    <div className="max-w-5xl space-y-5">
      {/* ── Metric Summary Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tickets", val: tickets.length, color: "text-white" },
          {
            label: "Open / Active",
            val: tickets.filter((t) => t.status === "Open" || t.status === "In Progress").length,
            color: "text-violet-400",
          },
          {
            label: "Pending",
            val: tickets.filter((t) => t.status === "Pending").length,
            color: "text-amber-400",
          },
          {
            label: "Resolved",
            val: tickets.filter((t) => t.status === "Resolved").length,
            color: "text-emerald-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
          >
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.val}
            </p>
          </div>
        ))}
      </div>

      {/* ── Controls & Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <h2 className="text-[15px] font-bold text-white/90">Ticket Management</h2>
          <p className="text-[11.5px] text-white/35">
            Assign agents, update progress, resolve, or edit ticket specifications
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] p-1 rounded-xl">
          {["All", "Open", "In Progress", "Pending", "Resolved", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all ${
                filterStatus === status
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ticket List ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredTickets.map((ticket, i) => {
          const isExpanded = expandedId === ticket.id;
          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden hover:border-white/[0.12] transition-colors"
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                {/* Title info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-[10.5px] text-white/30">{ticket.id}</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold"
                      style={{
                        color: PRIORITY_STYLE[ticket.priority]?.color,
                        background: PRIORITY_STYLE[ticket.priority]?.bg,
                      }}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold"
                      style={{
                        color: STATUS_STYLE[ticket.status]?.color,
                        background: STATUS_STYLE[ticket.status]?.bg,
                      }}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <h3 className="text-[13.5px] font-semibold text-white/90 truncate">
                    {ticket.subject}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-white/35 mt-1">
                    <span>{ticket.department}</span>
                    <span>•</span>
                    <span>{ticket.submittedBy.name}</span>
                    <span>•</span>
                    <span>{ticket.room || "No room specified"}</span>
                  </div>
                </div>

                {/* Quick Action Dropdowns */}
                <div className="flex items-center flex-wrap gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  {/* Agent Select */}
                  <select
                    value={ticket.agent || "Unassigned"}
                    onChange={(e) => assignAgent(ticket.id, e.target.value)}
                    className={`${inputCls} max-w-[140px] py-1.5 text-[11.5px]`}
                    style={{ colorScheme: "dark" }}
                  >
                    {AGENTS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>

                  {/* Status Select */}
                  <select
                    value={ticket.status}
                    onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                    className={`${inputCls} max-w-[125px] py-1.5 text-[11.5px]`}
                    style={{ colorScheme: "dark" }}
                  >
                    {["Open", "In Progress", "Pending", "Resolved", "Cancelled"].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingTicket(ticket)}
                    title="Edit Ticket Details"
                    className="p-2 rounded-xl border border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.09] text-white/60 hover:text-white transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(ticket.id)}
                    title="Delete Ticket"
                    className="p-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expandable Details Drawer */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-white/[0.06] bg-black/20 text-[12.5px] space-y-3">
                  <div>
                    <span className="font-semibold text-white/40 block mb-1">Issue Description:</span>
                    <p className="text-white/75 bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                      {ticket.descriptionPlain}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-white/50 text-[11.5px]">
                    <div><strong className="text-white/70">Topic:</strong> {ticket.helpTopic}</div>
                    <div><strong className="text-white/70">Contact Phone:</strong> {ticket.mobile || "N/A"}</div>
                    <div><strong className="text-white/70">User Email:</strong> {ticket.submittedBy.email}</div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {filteredTickets.length === 0 && (
          <div className="text-center py-12 text-white/30 text-xs">
            No tickets match the selected status.
          </div>
        )}
      </div>

      {/* ── Edit Ticket Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0d0c1d] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-[14px] font-bold text-white">
                  Edit Ticket ({editingTicket.id})
                </h3>
                <button
                  onClick={() => setEditingTicket(null)}
                  className="text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
                    Subject
                  </label>
                  <input
                    className={inputCls}
                    value={editingTicket.subject}
                    onChange={(e) =>
                      setEditingTicket({ ...editingTicket, subject: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
                      Priority
                    </label>
                    <select
                      className={inputCls}
                      value={editingTicket.priority}
                      onChange={(e) =>
                        setEditingTicket({ ...editingTicket, priority: e.target.value })
                      }
                      style={{ colorScheme: "dark" }}
                    >
                      {["Low", "Medium", "High", "Critical"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
                      Status
                    </label>
                    <select
                      className={inputCls}
                      value={editingTicket.status}
                      onChange={(e) =>
                        setEditingTicket({ ...editingTicket, status: e.target.value })
                      }
                      style={{ colorScheme: "dark" }}
                    >
                      {["Open", "In Progress", "Pending", "Resolved", "Cancelled"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
                    Assigned Agent
                  </label>
                  <select
                    className={inputCls}
                    value={editingTicket.agent || "Unassigned"}
                    onChange={(e) =>
                      setEditingTicket({
                        ...editingTicket,
                        agent: e.target.value === "Unassigned" ? null : e.target.value,
                      })
                    }
                    style={{ colorScheme: "dark" }}
                  >
                    {AGENTS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-white/40 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    className={inputCls}
                    value={editingTicket.descriptionPlain}
                    onChange={(e) =>
                      setEditingTicket({
                        ...editingTicket,
                        descriptionPlain: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTicket(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-white/[0.09] text-white/60 hover:bg-white/[0.05]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;