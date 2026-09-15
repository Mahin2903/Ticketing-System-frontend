/* eslint-disable no-unused-vars */
// src/Pages/Dashboards/UserDashboardHistory.jsx
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../Hooks/UseAxiosSecure";
import UseAuth from "../../Hooks/UseAuth";

// ── Status & Priority Styles ──────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  Low: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  Medium: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  High: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  Critical: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const STATUS_CONFIG = {
  Open: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", dot: "bg-violet-400" },
  "In Progress": { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", dot: "bg-sky-400 animate-pulse" },
  Pending: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
  Resolved: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  Closed: { text: "text-zinc-400", bg: "bg-zinc-800/60", border: "border-zinc-700/50", dot: "bg-zinc-500" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

const calcResolution = (created, completed) => {
  if (!completed || !created) return null;
  const ms = new Date(completed) - new Date(created);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── Subcomponents ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const formatted = capitalize(status);
  const config = STATUS_CONFIG[formatted] ?? STATUS_CONFIG["Closed"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {formatted}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const formatted = capitalize(priority);
  const config = PRIORITY_CONFIG[formatted] ?? PRIORITY_CONFIG["Medium"];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {formatted}
    </span>
  );
};

const DynamicSkeleton = ({ count = 3 }) => (
  <div className="flex flex-col gap-3.5 w-full">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 animate-pulse"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 w-24 rounded bg-zinc-800" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-md bg-zinc-800" />
            <div className="h-5 w-20 rounded-md bg-zinc-800" />
          </div>
        </div>
        <div className="h-5 w-3/5 rounded bg-zinc-800/70 mb-3" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 rounded bg-zinc-800/50" />
          <div className="h-3 w-28 rounded bg-zinc-800/50" />
          <div className="h-3 w-24 rounded bg-zinc-800/50" />
        </div>
      </div>
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const UserDashboardHistory = () => {
  const { user } = UseAuth();
  const queryClient = useQueryClient();

  // 1. Fetch DB User Profile
  const { data: dbUserData, isLoading: isUserLoading } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/users?email=${encodeURIComponent(user.email)}`);
      return res.data?.data || null;
    },
    enabled: !!user?.email,
    staleTime: 1000 * 60 * 15,
  });

  // 2. Fetch Tickets
  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    isFetching,
  } = useQuery({
    queryKey: ["tickets", dbUserData?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/tickets?user_id=${encodeURIComponent(dbUserData.id)}`);
      const data = res.data?.data || [];
      // Store ticket count in localStorage for skeleton dimension calculation on cold reloads
      if (typeof window !== "undefined") {
        localStorage.setItem("user_ticket_count", String(data.length));
      }
      return data;
    },
    enabled: !!dbUserData?.id,
    staleTime: 1000 * 60 * 2,
  });

  // 3. Dynamic Skeleton Count Determination
  const cachedCount = useMemo(() => {
    if (tickets.length > 0) return tickets.length;
    if (typeof window !== "undefined") {
      const saved = Number(localStorage.getItem("user_ticket_count"));
      if (saved > 0) return saved;
    }
    return 3; // Standard fallback on fresh profile
  }, [tickets.length]);

  // 4. Batch Fetch Help Topics for Available Tickets
  const topicIds = useMemo(() => {
    return [...new Set(tickets.map((t) => t.help_topic_id).filter(Boolean))];
  }, [tickets]);

  const { data: helpTopicsMap = {} } = useQuery({
    queryKey: ["helpTopics", topicIds],
    queryFn: async () => {
      if (!topicIds.length) return {};
      const topicRequests = topicIds.map((id) =>
        axiosInstance
          .get(`/api/help-topics/${id}`)
          .then((res) => {
            if (res.data?.success) {
              const topic = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
              return { id, title: topic?.topic_title || topic?.name || null };
            }
            return { id, title: null };
          })
          .catch(() => ({ id, title: null }))
      );

      const results = await Promise.all(topicRequests);
      const map = {};
      results.forEach(({ id, title }) => {
        if (title) map[id] = title;
      });
      return map;
    },
    enabled: topicIds.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  // 5. Cancel Ticket Mutation (Optimistic Update)
  const { mutate: cancelTicket, variables: activeDeletingId } = useMutation({
    mutationFn: async (ticketId) => {
      const res = await axiosInstance.delete(`/api/tickets/${ticketId}`);
      return res.data;
    },
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: ["tickets", dbUserData?.id] });
      const previousTickets = queryClient.getQueryData(["tickets", dbUserData?.id]);

      queryClient.setQueryData(["tickets", dbUserData?.id], (old = []) =>
        old.filter((t) => t.id !== ticketId)
      );

      return { previousTickets };
    },
    onError: (err, ticketId, context) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(["tickets", dbUserData?.id], context.previousTickets);
      }
      alert("Failed to cancel ticket. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", dbUserData?.id] });
    },
  });

  const handleCancelClick = (ticketId) => {
    if (window.confirm("Are you sure you want to cancel this ticket?")) {
      cancelTicket(ticketId);
    }
  };

  const isLoading = isUserLoading || isTicketsLoading;

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              Support History
            </h1>
            {isFetching && !isLoading && (
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Track, review, and manage your reported support tickets
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-zinc-400 px-3 py-1 rounded-md border border-zinc-800 bg-zinc-900 font-mono font-medium">
            {tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}
          </span>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <DynamicSkeleton count={cachedCount} />
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-3 border border-zinc-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-200">No support tickets found</p>
          <p className="text-xs text-zinc-500 mt-1">
            When you submit a request, it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {tickets.map((ticket, index) => {
              const statusKey = capitalize(ticket.status);
              const resolution = calcResolution(ticket.created_at, ticket.completed_at);
              const helpTopicName = helpTopicsMap[ticket.help_topic_id] ?? null;
              const isDeleting = activeDeletingId === ticket.id;

              return (
                <motion.div
                  key={ticket.ticket_number || ticket.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700/80 transition-all duration-200 overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    {/* Top Row: Ticket ID & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-zinc-400 tracking-wider">
                          #{ticket.ticket_number || ticket.id}
                        </span>
                        {ticket.department && (
                          <span className="text-xs text-zinc-500 font-normal">
                            / {ticket.department}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={ticket.priority} />
                        <StatusBadge status={ticket.status} />

                        {statusKey !== "Closed" && statusKey !== "Resolved" && (
                          <button
                            onClick={() => handleCancelClick(ticket.id)}
                            disabled={isDeleting}
                            className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 transition-colors disabled:opacity-40"
                          >
                            {isDeleting ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subject / Title */}
                    <h3 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors mb-3">
                      {helpTopicName || ticket.subject}
                    </h3>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Opened {fmtDate(ticket.created_at)}
                      </span>

                      {ticket.assigned_to ? (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Agent: <strong className="font-medium text-zinc-300">{ticket.assigned_to}</strong>
                          </span>
                        </>
                      ) : statusKey === "Pending" || statusKey === "Open" ? (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="text-amber-400/90 font-medium">Awaiting assignment</span>
                        </>
                      ) : null}

                      {resolution && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="text-emerald-400 font-medium">
                            Resolved in {resolution}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default UserDashboardHistory;