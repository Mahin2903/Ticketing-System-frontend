// src/Pages/Agent/AgentDashboardManagement.jsx
import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";
import UseAuth from "../../Hooks/UseAuth";

const PRIORITY_STYLE = {
  LOW:      { color: "#34d399", bg: "rgba(52,211,153,0.12)",  dot: "#34d399" },
  MEDIUM:   { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  dot: "#60a5fa" },
  HIGH:     { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  dot: "#fb923c" },
  CRITICAL: { color: "#f87171", bg: "rgba(248,113,113,0.12)", dot: "#f87171" },
  URGENT:   { color: "#f87171", bg: "rgba(248,113,113,0.12)", dot: "#f87171" },
};

const STATUS_STYLE = {
  PENDING:     { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  label: "Pending" },
  IN_PROGRESS: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", label: "In Progress" },
  COMPLETE:    { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "Complete" },
};

const FILTER_STATUSES = ["All", "PENDING", "IN_PROGRESS", "COMPLETE"];
const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "COMPLETE"];

const AgentDashboardManagement = () => {
  const axios = UseAxiosSecure();
  const { user } = UseAuth();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewScope, setViewScope] = useState("my-assigned"); // "my-assigned" | "all"

  // 1. Fetch Users to match current logged-in user
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data?.data || res.data || [];
    },
  });

  // Match current user in DB by email or fallback to first matching
  const currentDbUser = useMemo(() => {
    if (!user?.email) return null;
    return users.find((u) => u.email?.toLowerCase() === user.email.toLowerCase()) || null;
  }, [users, user?.email]);

  // 2. Fetch Tickets from backend API
  const {
    data: allTickets = [],
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ["agent-tickets"],
    queryFn: async () => {
      const res = await axios.get("/api/tickets");
      return res.data?.data || res.data || [];
    },
  });

  // 3. Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axios.get("/api/departments");
      return res.data?.data || res.data || [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agent-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
  };

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => axios.patch(`/api/tickets/${id}/status`, { status }),
    onSuccess: invalidate,
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to update status");
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assigned_to }) => axios.patch(`/api/tickets/${id}/assign`, { assigned_to }),
    onSuccess: invalidate,
  });

  // Filter assigned tickets to current user
  const assignedTickets = useMemo(() => {
    if (viewScope === "all") {
      return allTickets;
    }
    if (!currentDbUser) {
      // If user profile is still loading or no match found yet, check if assigned_to is present
      return allTickets.filter((t) => t.assigned_to != null);
    }
    return allTickets.filter((t) => t.assigned_to === currentDbUser.id);
  }, [allTickets, currentDbUser, viewScope]);

  // Filtered by status and search
  const filteredTickets = useMemo(() => {
    return assignedTickets.filter((ticket) => {
      const matchesStatus =
        filterStatus === "All" || ticket.status?.toUpperCase() === filterStatus;
      const matchesSearch =
        !searchTerm.trim() ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(ticket.id).includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [assignedTickets, filterStatus, searchTerm]);

  // Stats calculation
  const totalCount = assignedTickets.length;
  const pendingCount = assignedTickets.filter((t) => t.status?.toUpperCase() === "PENDING").length;
  const inProgressCount = assignedTickets.filter((t) => t.status?.toUpperCase() === "IN_PROGRESS").length;
  const completeCount = assignedTickets.filter((t) => t.status?.toUpperCase() === "COMPLETE").length;

  const isLoading = isTicketsLoading || isUsersLoading;

  return (
    <div className="max-w-6xl space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Assigned Tickets Management
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {currentDbUser ? (
              <span>
                Tickets assigned to <strong className="text-violet-400">{currentDbUser.name}</strong> ({currentDbUser.email})
              </span>
            ) : (
              "View and enter all tickets assigned to you for execution, updates, and progress."
            )}
          </p>
        </div>

        {/* Scope Toggle */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.07] shrink-0">
          <button
            onClick={() => setViewScope("my-assigned")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewScope === "my-assigned"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            My Assigned ({totalCount})
          </button>
          <button
            onClick={() => setViewScope("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewScope === "all"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            All System Tickets ({allTickets.length})
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Assigned", count: totalCount, color: "text-white", bg: "bg-white/10" },
          { label: "Pending", count: pendingCount, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "In Progress", count: inProgressCount, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Completed", count: completeCount, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/[0.07] bg-[#0d0c1d] p-4 flex flex-col gap-1 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/40">{stat.label}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${stat.bg}`} />
            </div>
            <p className={`text-2xl font-bold leading-none ${stat.color}`}>
              {isLoading ? "..." : stat.count}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket # or subject..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.07] p-1 rounded-xl overflow-x-auto">
          {FILTER_STATUSES.map((status) => {
            const count =
              status === "All"
                ? assignedTickets.length
                : assignedTickets.filter((t) => t.status?.toUpperCase() === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <span>{STATUS_STYLE[status]?.label || status}</span>
                <span
                  className={`text-[10px] tabular-nums ${
                    filterStatus === status ? "text-violet-400" : "text-white/25"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tickets List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse"
            />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0915] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mx-auto text-white/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-4-4z" />
              <polyline points="15 5 15 9 19 9" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-white/80">No Assigned Tickets Found</h4>
          <p className="text-xs text-white/35 max-w-sm mx-auto">
            {searchTerm
              ? `No tickets match "${searchTerm}" in this view.`
              : viewScope === "my-assigned"
              ? "You currently have no tickets assigned to your account."
              : "No tickets found matching the selected filter."}
          </p>
          {viewScope === "my-assigned" && (
            <button
              onClick={() => setViewScope("all")}
              className="mt-2 px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/30 text-xs font-semibold transition-colors"
            >
              Browse All System Tickets
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTickets.map((ticket, i) => {
              const priorityKey = ticket.priority?.toUpperCase() || "LOW";
              const statusKey = ticket.status?.toUpperCase() || "PENDING";
              const priStyle = PRIORITY_STYLE[priorityKey] || PRIORITY_STYLE.LOW;
              const stStyle = STATUS_STYLE[statusKey] || STATUS_STYLE.PENDING;
              const dept = departments.find((d) => d.id === ticket.department_id);
              const assignedAgent = users.find((u) => u.id === ticket.assigned_to);

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="rounded-2xl border border-white/[0.07] bg-[#0d0c1d] hover:border-violet-500/30 transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-lg"
                >
                  {/* Left: Ticket Details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10.5px] font-semibold text-white/40 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.06]">
                        {ticket.ticket_number || `TKT-${ticket.id}`}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1.5"
                        style={{ color: priStyle.color, backgroundColor: priStyle.bg }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: priStyle.dot }} />
                        {priorityKey}
                      </span>

                      {/* Status Badge */}
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ color: stStyle.color, backgroundColor: stStyle.bg }}
                      >
                        {stStyle.label}
                      </span>

                      {dept && (
                        <span className="text-[11px] text-white/35">
                          &bull; {dept.name}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-white/95 group-hover:text-violet-300 transition-colors truncate">
                      {ticket.subject}
                    </h4>

                    {ticket.description && (
                      <p className="text-xs text-white/40 line-clamp-1">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-white/30 pt-0.5">
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      {assignedAgent && (
                        <span>Assigned to: <strong className="text-white/60">{assignedAgent.name}</strong></span>
                      )}
                      {ticket.room && <span>Room: {ticket.room}</span>}
                    </div>
                  </div>

                  {/* Right: Actions & Enter Ticket Route Button */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {/* Status Select */}
                    <select
                      value={statusKey}
                      onChange={(e) =>
                        updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })
                      }
                      className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-violet-500/50 transition-colors"
                      style={{ colorScheme: "dark", color: stStyle.color }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_STYLE[s]?.label || s}
                        </option>
                      ))}
                    </select>

                    {/* ENTER TICKET BUTTON */}
                    <Link
                      to={`/agent/ticket/${ticket.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 cursor-pointer"
                    >
                      <span>Enter Ticket</span>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
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

export default AgentDashboardManagement;