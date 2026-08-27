/* eslint-disable no-unused-vars */
// src/Pages/Agent/AgentDashboard.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CURRENT_AGENT_NAME = "Tanvir Ahmed";

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
  "Cancelled":   { color: "rgba(255,255,255,0.28)", bg: "rgba(255,255,255,0.06)" },
};

const INITIAL_ASSIGNED_TASKS = [
  {
    id: "TKT-1002",
    subject: "Projector lamp blown in CSE Seminar Room",
    priority: "Medium",
    status: "In Progress",
    department: "Computer Science & Engineering",
    agent: "Tanvir Ahmed",
    submittedBy: { name: "Dr. Karim", email: "karim@univ.edu" },
    updatedAt: "2026-08-27T07:15:00Z",
    notes: "Replacement bulb retrieved from central IT storage.",
  },
  {
    id: "TKT-1005",
    subject: "OptiPlex 7080 workstation boot failure in Lab 2",
    priority: "High",
    status: "In Progress",
    department: "Computer Science & Engineering",
    agent: "Tanvir Ahmed",
    submittedBy: { name: "Sultana Parvin", email: "sultana@univ.edu" },
    updatedAt: "2026-08-26T16:40:00Z",
    notes: "Diagnosing RAM seating issue.",
  },
  {
    id: "TKT-1007",
    subject: "Request for Cisco VPN credentials approval",
    priority: "Low",
    status: "Pending",
    department: "Electrical & Electronic Engineering",
    agent: "Tanvir Ahmed",
    submittedBy: { name: "Kamrul Hasan", email: "kamrul@univ.edu" },
    updatedAt: "2026-08-25T10:12:00Z",
    notes: "Awaiting dean recommendation letter signature.",
  },
];

const COMPLETED_HISTORY = [
  {
    id: "TKT-0988",
    subject: "Faculty portal password reset lock",
    department: "Computer Science & Engineering",
    resolvedAt: "2026-08-23T14:20:00Z",
    resolutionNotes: "Identity verified via institutional phone; temporary link sent.",
  },
  {
    id: "TKT-0950",
    subject: "DBMS Server MySQL connection refused",
    department: "IT & Network Services",
    resolvedAt: "2026-08-20T11:05:00Z",
    resolutionNotes: "Restarted mysqld service daemon and expanded log partition space.",
  },
];

const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-2.5 text-white " +
  "text-[13px] placeholder:text-white/25 focus:outline-none " +
  "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-colors";

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

const AgentDashboard = () => {
  const [tasks, setTasks] = useState(INITIAL_ASSIGNED_TASKS);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Active");
  const [showHistory, setShowHistory] = useState(false);

  const displayedTasks = tasks.filter((t) => {
    if (filterStatus === "Active") return t.status !== "Resolved" && t.status !== "Cancelled";
    return t.status === filterStatus;
  });

  const handleUpdateStatus = (id, newStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTask.id
          ? { ...editingTask, updatedAt: new Date().toISOString() }
          : t
      )
    );
    setEditingTask(null);
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div>
          <h2 className="text-[18px] font-bold text-white">Agent Workspace</h2>
          <p className="text-[12px] text-white/40">
            Assigned to: <span className="text-violet-400 font-semibold">{CURRENT_AGENT_NAME}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Sync Enabled
        </div>
      </div>

      {/* ── Metric Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Active Tasks", val: tasks.filter((t) => t.status !== "Resolved" && t.status !== "Cancelled").length, color: "text-violet-400" },
          { label: "Pending Information", val: tasks.filter((t) => t.status === "Pending").length, color: "text-amber-400" },
          { label: "In Progress", val: tasks.filter((t) => t.status === "In Progress").length, color: "text-blue-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              {stat.label}
            </span>
            <span className={`text-2xl font-bold mt-2 ${stat.color}`}>
              {stat.val}
            </span>
          </div>
        ))}
      </div>

      {/* ── Status Filters & History Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["Active", "In Progress", "Pending", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-colors cursor-pointer shrink-0 ${
                filterStatus === st
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-[12px] font-semibold text-violet-400 hover:text-violet-300 self-start sm:self-auto cursor-pointer"
        >
          {showHistory ? "Hide Resolved History" : "View Resolved History →"}
        </button>
      </div>

      {/* ── Active Tasks List ── */}
      <div className="space-y-3">
        {displayedTasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.12] transition-all space-y-3"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10.5px] text-white/30">{task.id}</span>
                  <Badge label={task.priority} styleMap={PRIORITY_STYLE} />
                  <Badge label={task.status} styleMap={STATUS_STYLE} />
                  <span className="text-[11.5px] text-white/35 font-medium">
                    {task.department}
                  </span>
                </div>

                <h3 className="text-[14px] font-semibold text-white/90">
                  {task.subject}
                </h3>

                <p className="text-[11.5px] text-white/40">
                  User: <span className="text-white/70">{task.submittedBy.name}</span> ({task.submittedBy.email})
                </p>

                {task.notes && (
                  <div className="mt-2 text-[12px] text-violet-200/70 bg-violet-500/[0.06] border border-violet-500/10 p-2.5 rounded-xl">
                    <span className="font-semibold text-violet-400">Notes: </span>
                    {task.notes}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
                {task.status !== "Resolved" && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, "Resolved")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/20 text-[11.5px] font-semibold transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}

                {task.status !== "Cancelled" && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, "Cancelled")}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 text-[11.5px] font-semibold transition-colors"
                  >
                    Cancel Task
                  </button>
                )}

                <button
                  onClick={() => setEditingTask(task)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.1] border border-white/[0.08] text-[11.5px] font-semibold transition-colors"
                >
                  Edit / Note
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {displayedTasks.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm border border-dashed border-white/[0.08] rounded-2xl">
            No assigned tasks found for this status.
          </div>
        )}
      </div>

      {/* ── Optional Resolved History Accordion ── */}
      {showHistory && (
        <div className="pt-6 border-t border-white/[0.08] space-y-3">
          <h3 className="text-[15px] font-bold text-white/90">Resolved Task History</h3>
          {COMPLETED_HISTORY.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] text-white/30">{item.id}</span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Resolved on {new Date(item.resolvedAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-[14px] font-semibold text-white/85">{item.subject}</h4>
              <p className="text-[12px] text-white/50 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
                <span className="font-semibold text-white/70">Resolution Details: </span>
                {item.resolutionNotes}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0e1d] border border-white/[0.1] rounded-2xl p-6 w-full max-w-lg space-y-4"
            >
              <h3 className="text-[15px] font-bold text-white">Update Task ({editingTask.id})</h3>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="text-[11px] text-white/40 uppercase font-semibold tracking-wider">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className={inputCls}
                    style={{ colorScheme: "dark" }}
                  >
                    {Object.keys(STATUS_STYLE).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-white/40 uppercase font-semibold tracking-wider">Progress Notes</label>
                  <textarea
                    rows={3}
                    value={editingTask.notes || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                    placeholder="Add work updates or internal logs..."
                    className={inputCls}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] text-white/60 hover:bg-white/[0.1] text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 text-xs font-semibold"
                  >
                    Save Updates
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

export default AgentDashboard;