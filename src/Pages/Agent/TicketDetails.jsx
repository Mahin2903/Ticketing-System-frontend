import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { showToast, confirmDialog } from "../../lib/swal";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";
import UseAuth from "../../Hooks/UseAuth";
import UseTicketSocket from "../../Hooks/UseTicketSocket";
import { useUnread } from "../../Context/UnreadContext";
import TicketFeedbackCard from "../../Components/TicketFeedback/TicketFeedbackCard";

// ── Config Maps ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING: {
    label: "Pending", color: "#fbbf24",
    bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)",
    text: "text-amber-400", dot: "bg-amber-400",
  },
  IN_PROGRESS: {
    label: "In Progress", color: "#60a5fa",
    bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.25)",
    text: "text-blue-400", dot: "bg-blue-400 animate-pulse",
  },
  COMPLETE: {
    label: "Complete", color: "#34d399",
    bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.25)",
    text: "text-emerald-400", dot: "bg-emerald-400",
  },
};

const PRIORITY_CONFIG = {
  LOW:      { text: "text-emerald-400", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)"  },
  MEDIUM:   { text: "text-blue-400",    bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)"  },
  HIGH:     { text: "text-amber-400",   bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)"  },
  CRITICAL: { text: "text-rose-400",    bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  URGENT:   { text: "text-rose-400",    bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
};

const PRIORITY_COLOR = {
  LOW: "#34d399", MEDIUM: "#60a5fa", HIGH: "#fbbf24", CRITICAL: "#f87171", URGENT: "#f87171",
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
  "Verified — everything is working now. Thank you!",
];

// ── Small Reusable Components ──────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0">
    <span className="text-[12px] text-white/40">{label}</span>
    <span className="text-[12px] text-white/85 font-medium text-right max-w-[60%] truncate">{value || "—"}</span>
  </div>
);

const SectionHeading = ({ icon, title }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 shrink-0">
      {icon}
    </div>
    <h3 className="text-[13px] font-bold text-white/90">{title}</h3>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const TicketDetails = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const axios       = UseAxiosSecure();
  const { user }    = UseAuth();
  const queryClient = useQueryClient();
  const { markRead } = useUnread();

  const [newNote,           setNewNote]           = useState("");
  const [replySuccessToast, setReplySuccessToast] = useState("");
  const [copiedTicketNum,   setCopiedTicketNum]   = useState(false);
  const messagesEndRef = useRef(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: ticket, isLoading: isTicketLoading, isError: isTicketError, error: ticketError } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await axios.get(`/api/tickets/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
  });

  const { data: dbUserProfile } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      const res = await axios.get(`/api/users?email=${encodeURIComponent(user.email)}`);
      return res.data?.data || null;
    },
    enabled: !!user?.email,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data?.data || res.data || [];
    },
  });

  const currentUser = dbUserProfile || users.find((u) => u.email?.toLowerCase() === user?.email?.toLowerCase()) || null;
  const currentRole = (currentUser?.role || user?.role || "user").toLowerCase().replace(/[\s-]+/g, "_");
  const isStaff =
    currentRole === "admin" ||
    currentRole === "agent" ||
    currentRole === "super_admin" ||
    currentRole === "superadmin";

  const { data: repliesData = [], isLoading: isRepliesLoading } = useQuery({
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

  // ── Feedback Query ────────────────────────────────────────────────────────
  const { data: feedbackData = [], isLoading: isFeedbackLoading } = useQuery({
    queryKey: ["ticket-feedback", id],
    queryFn: async () => {
      const res = await axios.get(`/api/ticket-feedback/ticket/${id}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!id,
  });

  const { isConnected } = UseTicketSocket(
    id,
    currentUser,
    null,
    (newFeedback) => {
      showToast(
        "info",
        `Feedback received: ${newFeedback.user_name || "Requester"} submitted feedback.`
      );
    }
  );

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => { const res = await axios.get("/api/departments"); return res.data?.data || res.data || []; },
  });

  const { data: helpTopics = [] } = useQuery({
    queryKey: ["helpTopics"],
    queryFn: async () => { const res = await axios.get("/api/help-topics"); return res.data?.data || res.data || []; },
  });

  // ── Mark as read when replies finish loading ───────────────────────────────
  useEffect(() => {
    if (!isRepliesLoading && currentUser?.id && id) {
      markRead(id);
      queryClient.invalidateQueries({ queryKey: ["all-replies"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRepliesLoading, currentUser?.id, id]);

  useEffect(() => {
    if (replies.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies.length]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidateTicket = () => {
    queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    queryClient.invalidateQueries({ queryKey: ["ticket-feedback", id] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["agent-tickets"] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: (status) => axios.patch(`/api/tickets/${id}/status`, { status }),
    onSuccess: (_, status) => {
      invalidateTicket();
      showToast("success", `Status set to ${STATUS_CONFIG[status]?.label ?? status}`);
    },
    onError: (err) => showToast("error", err.response?.data?.message || "Failed to update status"),
  });

  const updatePriorityMutation = useMutation({
    mutationFn: (priority) => axios.patch(`/api/tickets/${id}`, { priority }),
    onSuccess: (_, priority) => {
      invalidateTicket();
      showToast("success", `Priority set to ${priority[0] + priority.slice(1).toLowerCase()}`);
    },
    onError: (err) => showToast("error", err.response?.data?.message || "Failed to update priority"),
  });

  const createReplyMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!currentUser?.id) throw new Error("User profile not resolved.");
      const res = await axios.post("/api/ticket-replies", {
        ticket_id: parseInt(id, 10),
        user_id:   parseInt(currentUser.id, 10),
        message:   messageText.trim(),
      });
      return res.data?.data || res.data;
    },
    onSuccess: (newReply) => {
      setNewNote("");
      setReplySuccessToast(
        isStaff
          ? "Reply posted — notification sent to the requester."
          : "Reply sent — notification sent to the assigned agent."
      );
      setTimeout(() => setReplySuccessToast(""), 6000);

      if (newReply?.id) {
        queryClient.setQueryData(["ticket-replies", id], (old) => {
          const list = Array.isArray(old) ? old : old?.data || [];
          if (list.some((r) => r.id === newReply.id)) return old;
          const updated = [...list, newReply];
          return Array.isArray(old) ? updated : { ...old, data: updated };
        });
      }

      if (currentUser?.id) {
        markRead(id);
        queryClient.invalidateQueries({ queryKey: ["all-replies"] });
      }
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors.join("\n") : err.message || "Failed to post reply");
      showToast("error", msg);
    },
  });

  // ── Confirmed Action Handlers ──────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    if (!isStaff || updateStatusMutation.isPending) return;
    const fromConfig = STATUS_CONFIG[ticket.status?.toUpperCase()] || STATUS_CONFIG.PENDING;
    const toConfig   = STATUS_CONFIG[newStatus];

    const result = await confirmDialog({
      title: "Change Status",
      html: `Move ticket from
        <strong style="color:${fromConfig.color}">${fromConfig.label}</strong>
        → <strong style="color:${toConfig.color}">${toConfig.label}</strong>?`,
      confirmText:  `Set ${toConfig.label}`,
      icon:         newStatus === "COMPLETE" ? "success" : "question",
      confirmColor: toConfig.color,
    });

    if (result.isConfirmed) updateStatusMutation.mutate(newStatus);
  };

  const handlePriorityChange = async (newPriority) => {
    if (updatePriorityMutation.isPending) return;
    const color = PRIORITY_COLOR[newPriority] || "#fff";

    const result = await confirmDialog({
      title: "Change Priority",
      html: `Set priority to <strong style="color:${color}">${newPriority[0] + newPriority.slice(1).toLowerCase()}</strong>?`,
      confirmText:  `Set ${newPriority[0] + newPriority.slice(1).toLowerCase()}`,
      icon:         newPriority === "CRITICAL" || newPriority === "URGENT" ? "warning" : "question",
      confirmColor: color,
    });

    if (result.isConfirmed) updatePriorityMutation.mutate(newPriority);
  };

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

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (isTicketLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-5">
        <div className="h-8 w-44 bg-white/[0.05] rounded-xl animate-pulse" />
        <div className="h-72 bg-white/[0.03] border border-white/[0.05] rounded-2xl animate-pulse" />
        <div className="h-52 bg-white/[0.03] border border-white/[0.05] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isTicketError || !ticket) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">!</div>
        <h3 className="text-[15px] font-bold text-white">Ticket not found</h3>
        <p className="text-[12.5px] text-white/40 leading-relaxed">
          {ticketError?.response?.data?.message || "This ticket does not exist or has been removed."}
        </p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-[12px] font-semibold transition-colors">
          ← Go back
        </button>
      </div>
    );
  }

  // ── Derived Values ─────────────────────────────────────────────────────────
  const assignedUser  = users.find((u) => u.id === ticket.assigned_to);
  const requesterUser = users.find((u) => u.id === ticket.user_id);
  const departmentObj = departments.find((d) => d.id === ticket.department_id);
  const helpTopicObj  = helpTopics.find((h) => h.id === ticket.help_topic_id);
  const isOwnTicket   = currentUser?.id && Number(currentUser.id) === Number(ticket.user_id);

  const statusKey    = ticket.status?.toUpperCase()   || "PENDING";
  const priorityKey  = ticket.priority?.toUpperCase() || "LOW";
  const statusConfig = STATUS_CONFIG[statusKey]    || STATUS_CONFIG.PENDING;
  const priConfig    = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.LOW;
  const stepIndex    = STATUS_STEPS.indexOf(statusKey) >= 0 ? STATUS_STEPS.indexOf(statusKey) : 0;

  const sortedReplies = [...replies].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => {
            if (isStaff) {
              navigate(-1);
            } else {
              navigate("/dashboard/user-dashboard-history");
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white text-[12px] font-medium transition-all cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {isStaff ? "Back to tickets" : "Back to Support History"}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const num = ticket.ticket_number || `TKT-${ticket.id}`;
              navigator.clipboard.writeText(num);
              setCopiedTicketNum(true);
              setTimeout(() => setCopiedTicketNum(false), 1800);
            }}
            title="Click to copy ticket number"
            className="flex items-center gap-1.5 font-mono text-[11px] text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-lg border border-white/[0.06] transition-all cursor-pointer"
          >
            <span>{ticket.ticket_number || `TKT-${ticket.id}`}</span>
            {copiedTicketNum ? (
              <span className="text-emerald-400 text-[10px] font-sans font-semibold">Copied!</span>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold border ${statusConfig.text}`}
            style={{ backgroundColor: statusConfig.bg, borderColor: statusConfig.border }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11.5px] font-semibold border uppercase ${priConfig.text}`}
            style={{ backgroundColor: priConfig.bg, borderColor: priConfig.border }}
          >
            {priorityKey}
          </span>
        </div>
      </div>

      {/* ── Main Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.08] bg-[#0d0c1d] p-6 sm:p-7 shadow-xl space-y-6"
      >
        <div className="space-y-1.5">
          <h1 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight leading-snug">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2.5 text-[11.5px] text-white/35">
            <span>Created {new Date(ticket.created_at).toLocaleString()}</span>
            {ticket.completed_at && (
              <>
                <span className="text-white/15">·</span>
                <span className="text-emerald-400/80 font-medium">Completed {new Date(ticket.completed_at).toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Internal Note from Admin: ONLY visible to Staff (Admin, Super Admin, Agent) ── */}
        {isStaff && ticket.assignment_note && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/[0.08] border border-violet-500/20">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10.5px] font-semibold text-violet-400/80 uppercase tracking-wider">Internal Note from Admin</p>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase">Staff Only</span>
              </div>
              <p className="text-[13px] text-white/70 leading-relaxed italic">"{ticket.assignment_note}"</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-[10.5px] font-semibold text-white/35 uppercase tracking-wider">Issue description</p>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-[13px] text-white/75 leading-relaxed">
            {/<[a-z][\s\S]*>/i.test(ticket.description || "") ? (
              <div
                className="space-y-2 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded text-[13px] text-white/80"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            ) : (
              <p className="whitespace-pre-wrap">{ticket.description || "No description provided."}</p>
            )}
          </div>
        </div>

        {/* ── Progress Section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-semibold text-white/35 uppercase tracking-wider">Progress Timeline</p>
            <span className="text-[11px] text-violet-400 font-medium">Step {stepIndex + 1} of {STATUS_STEPS.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_STEPS.map((step, idx) => {
              const isPassed  = idx <= stepIndex;
              const isCurrent = idx === stepIndex;
              const conf      = STATUS_CONFIG[step];
              return (
                <button key={step} onClick={() => isStaff && handleStatusChange(step)}
                  disabled={!isStaff || updateStatusMutation.isPending}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isCurrent ? "bg-violet-600/15 border-violet-500/40 shadow-sm shadow-violet-500/10"
                    : isPassed ? "bg-white/[0.03] border-white/[0.09] hover:border-white/[0.15]"
                    : "bg-white/[0.01] border-white/[0.04] opacity-45"
                  } ${!isStaff ? "cursor-default" : "cursor-pointer"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isPassed ? "bg-violet-500 text-white" : "bg-white/[0.08] text-white/35"
                    }`}>
                      {isPassed && !isCurrent ? "✓" : idx + 1}
                    </span>
                    <span className="text-[11.5px] font-semibold text-white/85">{conf.label}</span>
                  </div>
                  <p className="text-[10.5px] text-white/35 leading-snug">
                    {step === "PENDING" && "Logged & queued"}
                    {step === "IN_PROGRESS" && "Agent working"}
                    {step === "COMPLETE" && "Resolved"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.06]">
          {isStaff ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/35 font-medium">Status</span>
                <div className="flex items-center gap-1">
                  {STATUS_STEPS.map((step) => {
                    const conf     = STATUS_CONFIG[step];
                    const isActive = ticket.status === step;
                    return (
                      <button key={step} onClick={() => !isActive && handleStatusChange(step)}
                        disabled={isActive || updateStatusMutation.isPending}
                        className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all border cursor-pointer ${
                          isActive ? "text-white border-transparent font-semibold" : "bg-white/[0.03] hover:bg-white/[0.07] text-white/50 hover:text-white/80 border-white/[0.07]"
                        }`}
                        style={isActive ? { backgroundColor: conf.bg, borderColor: conf.border, color: conf.color } : {}}>
                        {conf.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/35 font-medium">Priority</span>
                <select value={priorityKey} onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={updatePriorityMutation.isPending}
                  className="bg-white/[0.05] border border-white/[0.09] rounded-lg px-2.5 py-1.5 text-[11.5px] text-white focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50 cursor-pointer"
                  style={{ colorScheme: "dark" }}>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                    <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 text-[12px]">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 font-medium text-[11.5px]">Status:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border ${statusConfig.text}`}
                    style={{ backgroundColor: statusConfig.bg, borderColor: statusConfig.border }}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 font-medium text-[11.5px]">Priority:</span>
                  <span className={`px-2.5 py-1 rounded-lg font-semibold border uppercase text-[11.5px] ${priConfig.text}`}
                    style={{ backgroundColor: priConfig.bg, borderColor: priConfig.border }}>
                    {priorityKey}
                  </span>
                </div>
              </div>
              <p className="text-[11.5px] text-white/45 italic">
                {statusKey === "PENDING" && "Your ticket is in the queue and being routed to an available specialist."}
                {statusKey === "IN_PROGRESS" && "Our support team is actively working on resolving your request."}
                {statusKey === "COMPLETE" && "Your ticket has been marked complete. Please leave your feedback below."}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Ticket Feedback Section (Active upon Ticket Completion) ── */}
      {(statusKey === "COMPLETE" || statusKey === "COMPLETED") && (
        <TicketFeedbackCard
          ticket={ticket}
          currentUser={currentUser}
          feedbackData={feedbackData}
          isLoadingFeedback={isFeedbackLoading}
          onReopenTicket={isStaff ? () => updateStatusMutation.mutate("IN_PROGRESS") : null}
          onFocusReply={(templateText) => {
            setNewNote(templateText);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0a0915] p-5">
          <SectionHeading title="Ticket details"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          />
          <InfoRow label="Department"      value={departmentObj?.department_title || departmentObj?.name || `#${ticket.department_id}`} />
          <InfoRow label="Help topic"      value={helpTopicObj?.topic || `Topic #${ticket.help_topic_id}`} />
          <InfoRow label="Room / Location" value={ticket.room} />
          <InfoRow label="Mobile"          value={ticket.mobile} />
          <InfoRow label="PABX"            value={ticket.pabx} />
          {ticket.building_name && <InfoRow label="Building" value={ticket.building_name} />}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0a0915] p-5">
          <SectionHeading title="People"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
          />
          {assignedUser ? (
            <div className="p-3 rounded-xl bg-violet-500/[0.08] border border-violet-500/20 flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-[11px] font-bold text-violet-200 shrink-0">
                {assignedUser?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[12.5px] font-semibold text-white/90 truncate">{assignedUser.name}</p>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-500/25 text-violet-300 uppercase">
                    {assignedUser.role || "Support Agent"}
                  </span>
                </div>
                <p className="text-[11px] text-white/35 truncate">{assignedUser.email}</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[12px] font-bold text-amber-300 shrink-0">
                ⏳
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[12.5px] font-semibold text-white/90">Awaiting Agent Assignment</p>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-300 uppercase">In Queue</span>
                </div>
                <p className="text-[11px] text-white/40">Our team is reviewing this ticket and will assign an agent shortly.</p>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.07] border border-white/[0.1] flex items-center justify-center text-[11px] font-bold text-white/50 shrink-0">
              {requesterUser?.name?.[0]?.toUpperCase() || (isOwnTicket ? (currentUser?.name?.[0]?.toUpperCase() || "U") : "U")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[12.5px] font-semibold text-white/80 truncate">
                  {requesterUser?.name || (isOwnTicket ? currentUser?.name || "You" : `User #${ticket.user_id}`)}
                </p>
                {isOwnTicket && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                    You
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/35 truncate">
                {requesterUser?.email || (isOwnTicket ? currentUser?.email : "Ticket requester")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Discussion Thread ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0915] p-6 sm:p-7 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white">Live updates</h3>
              <p className="text-[11px] text-white/35 mt-0.5">Real-time thread between staff and requester</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {isConnected ? "Live" : "Connecting…"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-sky-500/10 border-sky-500/20 text-sky-400">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Email alerts on
            </span>
            <span className="text-[11px] font-mono text-white/35 bg-white/[0.04] px-2 py-1 rounded-lg border border-white/[0.06]">
              {replies.length} {replies.length === 1 ? "update" : "updates"}
            </span>
          </div>
        </div>

        {/* Reply Thread */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {isRepliesLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-28 bg-white/[0.05] rounded" />
                    <div className="h-4 w-3/4 bg-white/[0.03] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedReplies.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-white/[0.07] space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-white/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-[13px] font-semibold text-white/55">No replies yet</p>
              <p className="text-[11.5px] text-white/30 max-w-xs mx-auto leading-relaxed">
                {isStaff
                  ? "Post troubleshooting notes or message the requester below."
                  : "Have an update on this ticket? Send a reply below."}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {sortedReplies.map((reply) => {
                const isStaffReply = ["admin", "agent"].includes((reply.user_role || "").toLowerCase());
                const isOwnReply   = reply.user_id === currentUser?.id;
                const senderName   = reply.user_name || (isStaffReply ? "Support staff" : "Requester");
                const initial      = senderName[0]?.toUpperCase() || "U";
                const roleLabel    = (reply.user_role || "user").toUpperCase();

                return (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`p-4 rounded-xl border transition-all ${
                      isStaffReply
                        ? "bg-violet-950/20 border-violet-500/20"
                        : "bg-white/[0.02] border-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 border ${
                        isStaffReply
                          ? "bg-violet-600/25 border-violet-500/35 text-violet-200"
                          : "bg-emerald-600/15 border-emerald-500/25 text-emerald-300"
                      }`}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-semibold text-white/90">{senderName}</span>
                            {isOwnReply && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.07] text-white/55">You</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              roleLabel === "ADMIN" ? "bg-rose-500/15 text-rose-300 border-rose-500/25"
                              : roleLabel === "AGENT" ? "bg-violet-500/15 text-violet-300 border-violet-500/25"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                            }`}>{roleLabel}</span>
                          </div>
                          <span className="text-[11px] text-white/30 font-mono">
                            {new Date(reply.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                            at {new Date(reply.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap break-words">{reply.message}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Templates */}
        <div className="pt-2 border-t border-white/[0.04] space-y-2">
          <p className="text-[12px] font-semibold text-white uppercase tracking-wider">Quick templates</p>
          <div className="flex flex-wrap gap-1.5">
            {(isStaff ? QUICK_RESPONSES_STAFF : QUICK_RESPONSES_USER).map((text) => (
              <button key={text} type="button" onClick={() => setNewNote(text)}
                className="px-2.5 py-1 rounded-lg text-[11.5px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-white/50 hover:text-white/80 transition-all text-left leading-snug">
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* Reply Composer */}
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={createReplyMutation.isPending || !currentUser?.id}
            placeholder={
              !currentUser?.id ? "Connecting user profile…"
              : isStaff ? "Write a note or reply to the requester…"
              : "Reply to the support agent...."
            }
            rows={3}
            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-violet-500/50 rounded-xl p-3.5 text-[12.5px] text-white placeholder-white/25 focus:outline-none transition-all resize-none leading-relaxed disabled:opacity-50"
          />

          <AnimatePresence>
            {replySuccessToast && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[12px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  {replySuccessToast}
                </div>
                <button type="button" onClick={() => setReplySuccessToast("")} className="text-white/35 hover:text-white text-[11px] px-1">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3">
            
            <button type="submit"
              disabled={!newNote.trim() || createReplyMutation.isPending || !currentUser?.id}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-semibold transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20">
              {createReplyMutation.isPending ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Post reply
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