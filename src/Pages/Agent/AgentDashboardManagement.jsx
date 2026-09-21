/* eslint-disable no-unused-vars */
// src/Pages/Agent/AgentDashboardManagement.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Changes vs original:
//  • Imports useUnread() to compute agent-side unread counts
//  • Batch-fetches replies for assigned/open tickets (30s poll)
//  • Applies UnreadRowIndicator / ActionRequiredChip / UnreadBadge per row
//  • Page header shows total unread count
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";
import UseAuth from "../../Hooks/UseAuth";
import { useUnread } from "../../Context/UnreadContext";
import {
  UnreadBadge,
  UnreadRowIndicator,
  ActionRequiredChip,
} from "../../Components/UnreadBadge";
import { parseFeedbackComment } from "../../Utilities/feedback.utils";

const PRIORITY_STYLE = {
  LOW:      { color: "#34d399", bg: "rgba(52,211,153,0.10)",  dot: "#34d399",  border: "rgba(52,211,153,0.25)"  },
  MEDIUM:   { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  dot: "#60a5fa",  border: "rgba(96,165,250,0.25)"  },
  HIGH:     { color: "#fb923c", bg: "rgba(251,146,60,0.10)",  dot: "#fb923c",  border: "rgba(251,146,60,0.25)"  },
  CRITICAL: { color: "#f87171", bg: "rgba(248,113,113,0.10)", dot: "#f87171",  border: "rgba(248,113,113,0.25)" },
  URGENT:   { color: "#f87171", bg: "rgba(248,113,113,0.10)", dot: "#f87171",  border: "rgba(248,113,113,0.25)" },
};

const STATUS_STYLE = {
  PENDING:     { color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)",  label: "Pending"     },
  IN_PROGRESS: { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)",  label: "In Progress" },
  COMPLETE:    { color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)",  label: "Complete"    },
};

const FILTER_STATUSES = ["All", "PENDING", "IN_PROGRESS", "COMPLETE"];
const STATUS_OPTIONS  = ["PENDING", "IN_PROGRESS", "COMPLETE"];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, count, color, isLoading }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-[#0d0c1d] p-4 flex flex-col gap-1.5 shadow-md">
    <span className="text-[11px] font-medium text-white/40 tracking-wide">{label}</span>
    <p className={`text-[28px] font-bold leading-none tracking-tight ${color}`}>
      {isLoading ? <span className="inline-block w-8 h-7 bg-white/[0.06] rounded-lg animate-pulse" /> : count}
    </p>
  </div>
);

const PriorityBadge = ({ priority }) => {
  const key = (priority || "LOW").toUpperCase();
  const s   = PRIORITY_STYLE[key] || PRIORITY_STYLE.LOW;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {key[0] + key.slice(1).toLowerCase()}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const key = (status || "PENDING").toUpperCase();
  const s   = STATUS_STYLE[key] || STATUS_STYLE.PENDING;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
};

const AssignmentNoteBanner = ({ note }) => {
  if (!note) return null;
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-violet-500/[0.08] border border-violet-500/20 mt-2.5">
      <div className="w-5 h-5 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold text-violet-400/80 uppercase tracking-wider mb-1">Note from admin</p>
        <p className="text-[12px] text-white/65 leading-relaxed italic">"{note}"</p>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AgentDashboardManagement = () => {
  const axios           = UseAxiosSecure();
  const { user }        = UseAuth();
  const queryClient     = useQueryClient();
  const { getUnreadState } = useUnread();

  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm,   setSearchTerm]   = useState("");
  const [viewScope,    setViewScope]    = useState("my-assigned");
  const [expandedNote, setExpandedNote] = useState(null);

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => { const res = await axios.get("/api/users"); return res.data?.data || res.data || []; },
  });

  const currentDbUser = useMemo(() => {
    if (!user?.email) return null;
    return users.find((u) => u.email?.toLowerCase() === user.email.toLowerCase()) || null;
  }, [users, user?.email]);

  const { data: allTickets = [], isLoading: isTicketsLoading } = useQuery({
    queryKey: ["agent-tickets"],
    queryFn: async () => { const res = await axios.get("/api/tickets"); return res.data?.data || res.data || []; },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => { const res = await axios.get("/api/departments"); return res.data?.data || res.data || []; },
  });

  // ── Batch-fetch replies for all non-complete tickets (for unread counts) ───
  const openTicketIds = useMemo(
    () => allTickets.filter((t) => t.status?.toUpperCase() !== "COMPLETE").map((t) => t.id),
    [allTickets]
  );

  const { data: repliesMap = {} } = useQuery({
    queryKey: ["agent-all-replies", openTicketIds.join(",")],
    queryFn: async () => {
      if (!openTicketIds.length) return {};
      const results = await Promise.allSettled(
        openTicketIds.map((id) =>
          axios.get(`/api/ticket-replies/ticket/${id}`).then((r) => ({
            id,
            replies: r.data?.data || r.data || [],
          }))
        )
      );
      const map = {};
      for (const result of results) {
        if (result.status === "fulfilled") map[result.value.id] = result.value.replies;
      }
      return map;
    },
    enabled: openTicketIds.length > 0,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agent-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => axios.patch(`/api/tickets/${id}/status`, { status }),
    onSuccess: invalidate,
    onError: (err) => alert(err.response?.data?.message || "Failed to update status"),
  });

  const assignedTickets = useMemo(() => {
    if (viewScope === "all") return allTickets;
    if (!currentDbUser) return allTickets.filter((t) => t.assigned_to != null);
    return allTickets.filter((t) => t.assigned_to === currentDbUser.id);
  }, [allTickets, currentDbUser, viewScope]);

  // Batch-fetch feedback for completed tickets
  const completedAgentTicketIds = useMemo(
    () =>
      allTickets
        .filter((t) => t.status?.toUpperCase() === "COMPLETE")
        .map((t) => t.id),
    [allTickets]
  );

  const { data: feedbackMap = {} } = useQuery({
    queryKey: ["agent-feedback", completedAgentTicketIds.join(",")],
    queryFn: async () => {
      if (!completedAgentTicketIds.length) return {};
      const results = await Promise.allSettled(
        completedAgentTicketIds.map((id) =>
          axios.get(`/api/ticket-feedback/ticket/${id}`).then((r) => ({
            id,
            feedback: Array.isArray(r.data?.data) ? r.data.data[0] : r.data?.data || null,
          }))
        )
      );
      const map = {};
      for (const result of results) {
        if (result.status === "fulfilled" && result.value?.feedback) {
          map[result.value.id] = result.value.feedback;
        }
      }
      return map;
    },
    enabled: completedAgentTicketIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const filteredTickets = useMemo(() => {
    return assignedTickets.filter((ticket) => {
      const matchesStatus = filterStatus === "All" || ticket.status?.toUpperCase() === filterStatus;
      const matchesSearch = !searchTerm.trim() ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(ticket.id).includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [assignedTickets, filterStatus, searchTerm]);

  const totalCount      = assignedTickets.length;
  const pendingCount    = assignedTickets.filter((t) => t.status?.toUpperCase() === "PENDING").length;
  const inProgressCount = assignedTickets.filter((t) => t.status?.toUpperCase() === "IN_PROGRESS").length;
  const completeCount   = assignedTickets.filter((t) => t.status?.toUpperCase() === "COMPLETE").length;
  const isLoading       = isTicketsLoading || isUsersLoading;

  // Total unread across all assigned tickets
  const totalUnread = useMemo(() => {
    let count = 0;
    for (const ticket of assignedTickets) {
      const state = getUnreadState(ticket.id, repliesMap[ticket.id] ?? []);
      count += state.unreadCount;
    }
    return count;
  }, [assignedTickets, repliesMap, getUnreadState]);

  return (
    <div className="max-w-6xl space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] font-bold text-white/95 tracking-tight">Assigned Tickets</h2>
            {/* Total unread pill */}
            {totalUnread > 0 && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400" />
                </span>
                {totalUnread} unread {totalUnread === 1 ? "reply" : "replies"}
              </motion.span>
            )}
          </div>
          <p className="text-[12px] text-white/40 mt-0.5 leading-relaxed">
            {currentDbUser ? (
              <>Viewing tickets assigned to <strong className="text-violet-400 font-semibold">{currentDbUser.name}</strong></>
            ) : "Tickets currently assigned to your account"}
          </p>
        </div>

        {/* Scope Toggle */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.07] shrink-0">
          {[
            { key: "my-assigned", label: "My Assigned", count: totalCount },
            { key: "all",         label: "All Tickets", count: allTickets.length },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setViewScope(key)}
              className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${
                viewScope === key ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-white/40 hover:text-white/70"
              }`}>
              {label}
              <span className={`ml-1.5 text-[10px] tabular-nums ${viewScope === key ? "text-violet-300" : "text-white/25"}`}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Assigned"  count={totalCount}      color="text-white"       isLoading={isLoading} />
        <StatCard label="Pending"         count={pendingCount}    color="text-amber-400"   isLoading={isLoading} />
        <StatCard label="In Progress"     count={inProgressCount} color="text-blue-400"    isLoading={isLoading} />
        <StatCard label="Complete"        count={completeCount}   color="text-emerald-400" isLoading={isLoading} />
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket # or subject…"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-[12px] text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-colors" />
        </div>

        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.07] p-1 rounded-xl overflow-x-auto">
          {FILTER_STATUSES.map((status) => {
            const count = status === "All"
              ? assignedTickets.length
              : assignedTickets.filter((t) => t.status?.toUpperCase() === status).length;
            const s = STATUS_STYLE[status];
            return (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap ${
                  filterStatus === status ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold" : "text-white/40 hover:text-white/70"
                }`}>
                {s?.label || status === "All" ? (s?.label || "All") : status}
                <span className={`text-[10px] tabular-nums ${filterStatus === status ? "text-violet-400" : "text-white/20"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Ticket List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0915] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mx-auto text-white/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="2" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-white/60">No tickets found</p>
          <p className="text-[12px] text-white/30 max-w-xs mx-auto leading-relaxed">
            {searchTerm ? `Nothing matches "${searchTerm}" in this view.`
              : viewScope === "my-assigned" ? "No tickets are assigned to your account yet."
              : "No tickets match the selected filter."}
          </p>
          {viewScope === "my-assigned" && (
            <button onClick={() => setViewScope("all")}
              className="mt-1 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/35 text-violet-300 border border-violet-500/25 text-[12px] font-semibold transition-colors">
              Browse all system tickets
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filteredTickets.map((ticket, i) => {
              const statusKey  = ticket.status?.toUpperCase() || "PENDING";
              const stStyle    = STATUS_STYLE[statusKey] || STATUS_STYLE.PENDING;
              const dept       = departments.find((d) => d.id === ticket.department_id);
              const hasNote    = !!ticket.assignment_note;
              const isExpanded = expandedNote === ticket.id;

              // Unread state for this ticket row
              const ticketReplies             = repliesMap[ticket.id] ?? [];
              const { hasUnread, unreadCount } = getUnreadState(ticket.id, ticketReplies);

              return (
                <motion.div key={ticket.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.18 }}>
                  <UnreadRowIndicator hasUnread={hasUnread}>
                    <div className={`rounded-2xl border transition-all shadow-sm group ${
                      hasUnread
                        ? "border-violet-500/30 bg-[#0f0e20] shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_4px_24px_rgba(139,92,246,0.07)]"
                        : "border-white/[0.07] bg-[#0d0c1d] hover:border-white/[0.12]"
                    }`}>
                      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">

                        {/* Left: Ticket Info */}
                        <div className="min-w-0 flex-1 space-y-2">
                          {/* Top line: ticket number + badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-mono text-[10.5px] font-medium px-2 py-0.5 rounded-md border ${
                              hasUnread ? "text-violet-400 bg-violet-500/10 border-violet-500/20" : "text-white/35 bg-white/[0.04] border-white/[0.06]"
                            }`}>
                              {ticket.ticket_number || `TKT-${ticket.id}`}
                            </span>
                            {hasUnread && <UnreadBadge count={unreadCount} variant="compact" />}
                            <PriorityBadge priority={ticket.priority} />
                            <StatusBadge   status={ticket.status}   />

                            {/* Completed ticket feedback status */}
                            {statusKey === "COMPLETE" && (() => {
                              const fb = feedbackMap[ticket.id];
                              if (fb) {
                                const parsed = parseFeedbackComment(fb.comment);
                                const isSatisfied = parsed.type === "Satisfied";
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${
                                      isSatisfied
                                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                        : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                    }`}
                                  >
                                    {isSatisfied ? "⭐ Satisfied" : "✅ Done"}
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-md border bg-white/[0.03] text-white/35 border-white/[0.06]">
                                  Awaiting Feedback
                                </span>
                              );
                            })()}

                            {dept && <span className="text-[11px] text-white/30">{dept.department_title || dept.name}</span>}
                          </div>

                          {/* Subject */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-[13.5px] leading-snug transition-colors ${
                              hasUnread ? "font-semibold text-white group-hover:text-white" : "font-semibold text-white/90 group-hover:text-white"
                            }`}>
                              {ticket.subject}
                            </h4>
                            {hasUnread && <ActionRequiredChip count={unreadCount} />}
                          </div>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/30">
                            <span>{new Date(ticket.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                            {ticket.room && (<><span className="text-white/15">·</span><span>{ticket.room}</span></>)}
                            {ticket.mobile && (<><span className="text-white/15">·</span><span className="font-mono">{ticket.mobile}</span></>)}
                          </div>

                          {/* Assignment Note — expandable */}
                          {hasNote && (
                            <div>
                              <button onClick={() => setExpandedNote(isExpanded ? null : ticket.id)}
                                className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-400/80 hover:text-violet-300 transition-colors">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Note from admin
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                  className={`transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}>
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </button>
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} className="overflow-hidden">
                                    <AssignmentNoteBanner note={ticket.assignment_note} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Customer Feedback Note if available */}
                          {statusKey === "COMPLETE" && feedbackMap[ticket.id] && (() => {
                            const parsed = parseFeedbackComment(feedbackMap[ticket.id].comment);
                            if (!parsed.note && (!parsed.tags || parsed.tags.length === 0)) return null;
                            return (
                              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 mt-2">
                                <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 text-emerald-300 text-[10px]">
                                  ★
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <p className="text-[10.5px] font-semibold text-emerald-400/90 uppercase tracking-wider">
                                      Customer Feedback · {parsed.type}
                                    </p>
                                    {parsed.tags?.map((t) => (
                                      <span key={t} className="px-1.5 py-0.2 rounded text-[9.5px] bg-emerald-500/15 text-emerald-300 font-medium">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                  {parsed.note && (
                                    <p className="text-[12px] text-white/70 leading-relaxed italic">"{parsed.note}"</p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Right: Controls */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                          <select value={statusKey}
                            onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-white/[0.05] border border-white/[0.09] rounded-xl px-2.5 py-2 text-[11.5px] focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50 cursor-pointer"
                            style={{ colorScheme: "dark", color: stStyle.color }}>
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{STATUS_STYLE[s]?.label || s}</option>
                            ))}
                          </select>

                          <Link to={`/agent/ticket/${ticket.id}`}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[12px] font-semibold transition-all whitespace-nowrap ${
                              hasUnread
                                ? "bg-violet-500 hover:bg-violet-400 shadow-lg shadow-violet-500/25"
                                : "bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/15 hover:shadow-violet-500/25"
                            }`}>
                            {hasUnread ? "Reply Now" : "Enter ticket"}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </UnreadRowIndicator>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AgentDashboardManagement;