import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";
import UseAuth from "../../Hooks/UseAuth";
import UseTicketSocket from "../../Hooks/UseTicketSocket";

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

const QUICK_RESPONSES_STAFF = [
  "Investigating the issue now.",
  "Could you provide additional details or screenshots?",
  "We have applied a fix. Please verify on your end.",
  "Ticket resolved. Let us know if you need anything else!",
];

const QUICK_RESPONSES_USER = [
  "Thank you for the update!",
  "The issue is still occurring on my end.",
  "I have provided the requested information.",
  "Verified and everything is working properly now. Thank you!",
];

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axios = UseAxiosSecure();
  const { user } = UseAuth();
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState("");
  const [replySuccessToast, setReplySuccessToast] = useState("");
  const messagesEndRef = useRef(null);

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

  // Fetch Current Logged-in User Profile from DB
  const { data: dbUserProfile } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      const res = await axios.get(`/api/users?email=${encodeURIComponent(user.email)}`);
      return res.data?.data || null;
    },
    enabled: !!user?.email,
  });

  // Fetch Users
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data?.data || res.data || [];
    },
  });

  // Resolve current active user identity
  const currentUser =
    dbUserProfile ||
    users.find((u) => u.email?.toLowerCase() === user?.email?.toLowerCase()) ||
    null;

  const currentRole = (currentUser?.role || "user").toLowerCase();
  const isStaff = currentRole === "admin" || currentRole === "agent";

  // Fetch Ticket Replies from backend REST API
  const {
    data: repliesData = [],
    isLoading: isRepliesLoading,
  } = useQuery({
    queryKey: ["ticket-replies", id],
    queryFn: async () => {
      const res = await axios.get(`/api/ticket-replies/ticket/${id}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!id,
  });

  const replies = Array.isArray(repliesData)
    ? repliesData
    : Array.isArray(repliesData?.data)
    ? repliesData.data
    : [];

  // Connect to Socket.IO and join ticket room
  const { isConnected } = UseTicketSocket(id, currentUser);

  // Auto-scroll when new replies appear
  useEffect(() => {
    if (replies.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies.length]);

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

  // Create Reply Mutation via /api/ticket-replies
  const createReplyMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!currentUser?.id) {
        throw new Error("User profile not resolved. Please ensure you are logged in.");
      }
      const payload = {
        ticket_id: parseInt(id, 10),
        user_id: parseInt(currentUser.id, 10),
        message: messageText.trim(),
      };
      const res = await axios.post("/api/ticket-replies", payload);
      return res.data?.data || res.data;
    },
    onSuccess: (newReply) => {
      setNewNote("");
      setReplySuccessToast(
        isStaff
          ? "Reply posted! Socket updated & notification email sent to the requester."
          : "Reply sent! Socket updated & notification email sent to the assigned agent."
      );
      setTimeout(() => setReplySuccessToast(""), 6000);
      // Optimistically insert reply if not already delivered via socket
      if (newReply && newReply.id) {
        queryClient.setQueryData(["ticket-replies", id], (old) => {
          const list = Array.isArray(old) ? old : old?.data || [];
          if (list.some((r) => r.id === newReply.id)) return old;
          const updated = [...list, newReply];
          return Array.isArray(old) ? updated : { ...old, data: updated };
        });
      }
    },
    onError: (err) => {
      const errMsg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.join("\n")
          : err.message || "Failed to post reply");
      alert(errMsg);
    },
  });

  const handleAddNote = (e) => {
    if (e) e.preventDefault();
    const text = newNote.trim();
    if (!text || createReplyMutation.isPending) return;
    createReplyMutation.mutate(text);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAddNote();
    }
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
          {isStaff ? "Back to Tickets" : "Back to My Tickets"}
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
                  onClick={() => isStaff && updateStatusMutation.mutate(step)}
                  disabled={!isStaff || updateStatusMutation.isPending}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    isCurrent
                      ? "bg-violet-600/20 border-violet-500/50 shadow-lg shadow-violet-500/10"
                      : isPassed
                      ? "bg-white/[0.04] border-white/[0.1] hover:border-white/[0.2]"
                      : "bg-white/[0.02] border-white/[0.04] opacity-50"
                  } ${!isStaff ? "cursor-default" : "cursor-pointer"}`}
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
          {isStaff ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center justify-between w-full text-xs text-white/50">
              <div className="flex items-center gap-2">
                <span>Current Status:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold border ${statusConfig.border} ${statusConfig.text}`} style={{ backgroundColor: statusConfig.bg }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Priority:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold border ${priorityConfig.border} ${priorityConfig.bg} ${priorityConfig.text} uppercase`}>
                  {priorityKey}
                </span>
              </div>
            </div>
          )}
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

      {/* ── Real-Time Live Updates & Discussion Stream (Socket.IO) ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0915] p-6 sm:p-7 space-y-6 shadow-xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Live Updates & Progress Notes
                </h3>
                <p className="text-xs text-white/40">
                  Real-time synchronization between staff and requester powered by Socket.IO
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Live Socket.IO Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                isConnected
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              {isConnected ? "Live Connected" : "Connecting..."}
            </span>

            {/* Email Notification Status Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-sky-500/10 border-sky-500/20 text-sky-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Email Alerts Active
            </span>

            <span className="text-xs font-mono text-white/40 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
              {replies.length} {replies.length === 1 ? "Update" : "Updates"}
            </span>
          </div>
        </div>

        {/* Replies Conversation Thread */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {isRepliesLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.05]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-32 bg-white/[0.05] rounded" />
                    <div className="h-4 w-3/4 bg-white/[0.03] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-white/[0.07] bg-white/[0.01] space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-white/40">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white/70">No notes or replies logged yet</p>
              <p className="text-xs text-white/35 max-w-sm mx-auto">
                {isStaff
                  ? "Post troubleshooting notes, progress updates, or message the requester below."
                  : "Have an update or question about this ticket? Send a reply below."}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {[...replies]
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .map((reply) => {
                  const isStaffReply =
                    (reply.user_role || "").toLowerCase() === "admin" ||
                    (reply.user_role || "").toLowerCase() === "agent";
                  const isOwnReply = reply.user_id === currentUser?.id;
                  const senderName = reply.user_name || (isStaffReply ? "Support Staff" : "Requester");
                  const initial = senderName[0]?.toUpperCase() || "U";
                  const roleLabel = (reply.user_role || "user").toUpperCase();

                  return (
                    <motion.div
                      key={reply.id}
                      initial={{ opacity: 0, y: 10, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 rounded-xl border transition-all ${
                        isStaffReply
                          ? "bg-violet-950/20 border-violet-500/25"
                          : "bg-white/[0.02] border-white/[0.07]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                            isStaffReply
                              ? "bg-violet-600/30 border-violet-500/40 text-violet-200"
                              : "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
                          }`}
                        >
                          {initial}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white/90 truncate">
                                {senderName}
                              </span>
                              {isOwnReply && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/[0.08] text-white/70">
                                  You
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                  roleLabel === "ADMIN"
                                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                    : roleLabel === "AGENT"
                                    ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                }`}
                              >
                                {roleLabel}
                              </span>
                            </div>

                            <span className="text-[11px] text-white/35 font-mono">
                              {new Date(reply.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(reply.created_at).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap break-words">
                            {reply.message}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Response Suggestions */}
        <div className="pt-2 border-t border-white/[0.04] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
              Quick Templates:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(isStaff ? QUICK_RESPONSES_STAFF : QUICK_RESPONSES_USER).map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => setNewNote(text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white transition-all text-left"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reply Composer Form */}
        <form onSubmit={handleAddNote} className="space-y-3 pt-1">
          <div className="relative">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={createReplyMutation.isPending || !currentUser?.id}
              placeholder={
                !currentUser?.id
                  ? "Connecting user profile..."
                  : isStaff
                  ? "Write an internal note or reply to the user... (Press Ctrl + Enter to send)"
                  : "Write a reply to the support agent... (Press Ctrl + Enter to send)"
              }
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-violet-500/60 rounded-xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Email dispatch toast banner */}
          <AnimatePresence>
            {replySuccessToast && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{replySuccessToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplySuccessToast("")}
                  className="text-white/40 hover:text-white text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[11px] text-white/30">
                💡 Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 text-[10px] font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 text-[10px] font-mono">Enter</kbd> to quickly send
              </p>
              <p className="text-[10.5px] text-sky-400/80 flex items-center gap-1.5">
                <span>✉️</span>
                <span>
                  Automatically dispatches email alert to{" "}
                  <strong className="text-white/80">
                    {isStaff
                      ? requesterUser?.email || "the ticket creator"
                      : assignedUser?.email || "the assigned support agent"}
                  </strong>
                </span>
              </p>
            </div>

            <button
              type="submit"
              disabled={!newNote.trim() || createReplyMutation.isPending || !currentUser?.id}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-violet-600/25 cursor-pointer"
            >
              {createReplyMutation.isPending ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Post Reply</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketDetails;

