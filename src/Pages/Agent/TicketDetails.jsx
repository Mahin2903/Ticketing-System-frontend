// src/Pages/Agent/TicketDetails.jsx
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";
import UseAuth from "../../Hooks/UseAuth";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "border-amber-500/30",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "border-blue-500/30",
    text: "text-blue-400",
    dot: "bg-blue-400 animate-pulse",
  },
  COMPLETE: {
    label: "Complete",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
};

const PRIORITY_CONFIG = {
  LOW: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  MEDIUM: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  HIGH: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  CRITICAL: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  URGENT: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const STATUS_STEPS = ["PENDING", "IN_PROGRESS", "COMPLETE"];

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axios = UseAxiosSecure();
  const { user } = UseAuth();
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState("");
  const [localNotes, setLocalNotes] = useState([]);

  // Fetch Ticket Details
  const {
    data: ticket,
    isLoading: isTicketLoading,
    isError: isTicketError,
    error: ticketError,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await axios.get(`/api/tickets/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
  });

  // Fetch Users
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data?.data || res.data || [];
    },
  });

  // Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axios.get("/api/departments");
      return res.data?.data || res.data || [];
    },
  });

  // Fetch Help Topics
  const { data: helpTopics = [] } = useQuery({
    queryKey: ["helpTopics"],
    queryFn: async () => {
      const res = await axios.get("/api/help-topics");
      return res.data?.data || res.data || [];
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status) => axios.patch(`/api/tickets/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["agent-tickets"] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to update status");
    },
  });

  // Update Priority Mutation
  const updatePriorityMutation = useMutation({
    mutationFn: (priority) => axios.patch(`/api/tickets/${id}`, { priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["agent-tickets"] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to update priority");
    },
  });

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const noteObj = {
      id: Date.now(),
      author: user?.displayName || user?.email || "Support Agent",
      content: newNote.trim(),
      created_at: new Date().toISOString(),
    };
    setLocalNotes((prev) => [noteObj, ...prev]);
    setNewNote("");
  };

  if (isTicketLoading) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-6">
        <div className="h-8 w-48 bg-white/[0.05] rounded-xl animate-pulse" />
        <div className="h-64 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse" />
        <div className="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isTicketError || !ticket) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>
        <h3 className="text-lg font-bold text-white">Ticket Not Found</h3>
        <p className="text-sm text-white/40">
          {ticketError?.response?.data?.message || "The requested ticket does not exist or has been removed."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/80 text-xs font-semibold transition-colors"
        >
          &larr; Go Back
        </button>
      </div>
    );
  }

  const assignedUser = users.find((u) => u.id === ticket.assigned_to);
  const requesterUser = users.find((u) => u.id === ticket.user_id);
  const departmentObj = departments.find((d) => d.id === ticket.department_id);
  const helpTopicObj = helpTopics.find((h) => h.id === ticket.help_topic_id);

  const statusKey = ticket.status?.toUpperCase() || "PENDING";
  const priorityKey = ticket.priority?.toUpperCase() || "LOW";
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING;
  const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.LOW;

  const currentStepIndex = STATUS_STEPS.indexOf(statusKey) >= 0 ? STATUS_STEPS.indexOf(statusKey) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── Top Bar / Breadcrumb ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Assigned Tickets
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/40 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
            {ticket.ticket_number || `TKT-${ticket.id}`}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${statusConfig.border} ${statusConfig.text}`} style={{ backgroundColor: statusConfig.bg }}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${priorityConfig.border} ${priorityConfig.bg} ${priorityConfig.text} uppercase`}>
            {priorityKey}
          </span>
        </div>
      </div>

      {/* ── Main Ticket Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.08] bg-[#0d0c1d] p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {ticket.subject}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
            <span>Created on {new Date(ticket.created_at).toLocaleString()}</span>
            {ticket.completed_at && (
              <>
                <span>&bull;</span>
                <span className="text-emerald-400/80">Completed on {new Date(ticket.completed_at).toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Issue Description
          </h3>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-[13.5px] text-white/80 leading-relaxed whitespace-pre-wrap">
            {ticket.description || "No description provided."}
          </div>
        </div>

        {/* ── Status Timeline / Progress Bar ── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Ticket Progress Lifecycle
            </h3>
            <span className="text-xs text-violet-400 font-medium">
              Step {currentStepIndex + 1} of {STATUS_STEPS.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 relative">
            {STATUS_STEPS.map((step, idx) => {
              const isPassed = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const conf = STATUS_CONFIG[step];

              return (
                <button
                  key={step}
                  onClick={() => updateStatusMutation.mutate(step)}
                  disabled={updateStatusMutation.isPending}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    isCurrent
                      ? "bg-violet-600/20 border-violet-500/50 shadow-lg shadow-violet-500/10"
                      : isPassed
                      ? "bg-white/[0.04] border-white/[0.1] hover:border-white/[0.2]"
                      : "bg-white/[0.02] border-white/[0.04] opacity-50 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isPassed
                          ? "bg-violet-500 text-white"
                          : "bg-white/[0.1] text-white/40"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white/90">{conf.label}</span>
                  </div>
                  <p className="text-[11px] text-white/35">
                    {step === "PENDING" && "Ticket logged & queued"}
                    {step === "IN_PROGRESS" && "Agent actively working"}
                    {step === "COMPLETE" && "Resolved and verified"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Quick Action Controls ── */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-medium">Update Status:</span>
            {STATUS_STEPS.map((step) => (
              <button
                key={step}
                onClick={() => updateStatusMutation.mutate(step)}
                disabled={ticket.status === step || updateStatusMutation.isPending}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  ticket.status === step
                    ? "bg-violet-600 text-white font-semibold"
                    : "bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.06]"
                }`}
              >
                {STATUS_CONFIG[step]?.label || step}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-medium">Priority:</span>
            <select
              value={priorityKey}
              onChange={(e) => updatePriorityMutation.mutate(e.target.value)}
              disabled={updatePriorityMutation.isPending}
              className="bg-white/[0.05] border border-white/[0.09] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
              style={{ colorScheme: "dark" }}
            >
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* ── Information Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ticket Metadata */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0a0915] p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Ticket & Department Details
          </h3>

          <div className="space-y-3 text-xs divide-y divide-white/[0.04]">
            <div className="flex items-center justify-between pt-2">
              <span className="text-white/40">Department</span>
              <span className="text-white/90 font-medium">{departmentObj?.name || `Department #${ticket.department_id || "N/A"}`}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-white/40">Help Topic</span>
              <span className="text-white/90 font-medium">{helpTopicObj?.topic || `Topic #${ticket.help_topic_id || "N/A"}`}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-white/40">Room / Location</span>
              <span className="text-white/90 font-medium">{ticket.room || "Not specified"}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-white/40">Contact Mobile</span>
              <span className="text-white/90 font-mono font-medium">{ticket.mobile || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-white/40">PABX Extension</span>
              <span className="text-white/90 font-mono font-medium">{ticket.pabx || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Assigned Agent & Requester */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0a0915] p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Assigned Agent & Requester
          </h3>

          <div className="space-y-4">
            {/* Assigned Agent */}
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-600/40 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-200">
                {assignedUser?.name?.[0] || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white/90 truncate">{assignedUser?.name || "Assigned Agent"}</p>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/30 text-violet-300">
                    {assignedUser?.role || "Agent"}
                  </span>
                </div>
                <p className="text-[11px] text-white/40 truncate">{assignedUser?.email || "Agent assigned"}</p>
              </div>
            </div>

            {/* Requester Info */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.1] flex items-center justify-center text-xs font-bold text-white/60">
                {requesterUser?.name?.[0] || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white/85 truncate">{requesterUser?.name || `User ID #${ticket.user_id}`}</p>
                <p className="text-[11px] text-white/40 truncate">{requesterUser?.email || "Ticket Requester"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Updates, Notes & Progress Logs ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0a0915] p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Live Updates & Progress Notes
          </h3>
          <p className="text-xs text-white/35 mt-0.5">
            Log progress updates, troubleshooting steps, and resolution notes for this ticket.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a live update or progress note for this ticket..."
            rows={3}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-violet-600/20"
            >
              Post Update
            </button>
          </div>
        </form>

        {/* Notes / Activity List */}
        <div className="space-y-3 pt-2">
          {localNotes.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/25 border border-dashed border-white/[0.06] rounded-xl">
              No additional notes logged yet. Post an update above to track ongoing progress.
            </div>
          ) : (
            <AnimatePresence>
              {localNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-violet-300">{note.author}</span>
                    <span className="text-[10.5px] text-white/30">{new Date(note.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">{note.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
