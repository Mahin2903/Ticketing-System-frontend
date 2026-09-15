/* eslint-disable no-unused-vars */
import React from "react";
import { useQuery } from "@tanstack/react-query";

// ── API Fetchers ─────────────────────────────────────────────────────────────
const fetchTickets = async () => {
  const res = await fetch("/api/tickets");
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
};

const fetchDepartments = async () => {
  const res = await fetch("/api/departments");
  if (!res.ok) throw new Error("Failed to fetch departments");
  return res.json();
};

const fetchUsers = async () => {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

// ── Minimal Visual Elements ───────────────────────────────────────────
const Sparkline = ({ color = "#8b5cf6", values = [5, 10, 8, 15, 12, 20] }) => {
  const w = 100, h = 28, pad = 2;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = (w - pad * 2) / Math.max(values.length - 1, 1);
  const pts = values
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={`${pad},${h} ${pts} ${pad + (values.length - 1) * step},${h}`}
        fill={color}
        opacity="0.1"
        stroke="none"
      />
    </svg>
  );
};

export default function AdminDashboardOverView() {
  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: ticketsData,
    isLoading: isLoadingTickets,
    isError: isErrorTickets,
  } = useQuery({ queryKey: ["tickets"], queryFn: fetchTickets });

  const {
    data: departmentsData,
    isLoading: isLoadingDepts,
  } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });

  const {
    data: usersData,
    isLoading: isLoadingUsers,
  } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  // ── Extract Data Normalization ─────────────────────────────────────────────
  const tickets = Array.isArray(ticketsData) ? ticketsData : ticketsData?.data || [];
  const departments = Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || [];
  const users = Array.isArray(usersData) ? usersData : usersData?.data || [];

  // ── Derived Metrics ────────────────────────────────────────────────────────
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(
    (t) => (t.status || "").toLowerCase() === "resolved" || (t.status || "").toLowerCase() === "closed"
  ).length;
  const pendingTickets = tickets.filter(
    (t) => (t.status || "").toLowerCase() === "pending" || (t.status || "").toLowerCase() === "open"
  );
  const criticalTickets = tickets.filter(
    (t) =>
      ((t.priority || "").toLowerCase() === "critical" || (t.priority || "").toLowerCase() === "high") &&
      (t.status || "").toLowerCase() !== "resolved"
  ).length;

  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  // Department Load Aggregations
  const deptMap = departments.map((dept) => {
    const deptTickets = tickets.filter((t) => t.department_id === dept.id || t.departmentId === dept.id);
    const openCount = deptTickets.filter((t) => (t.status || "").toLowerCase() !== "resolved").length;
    const resolvedCount = deptTickets.filter((t) => (t.status || "").toLowerCase() === "resolved").length;
    const totalDept = deptTickets.length;
    const pct = totalTickets > 0 ? Math.round((totalDept / totalTickets) * 100) : 0;

    return {
      ...dept,
      open: openCount,
      resolved: resolvedCount,
      pct,
    };
  });

  // User Assignment Aggregations
  const userMap = users.map((u) => {
    const activeCount = tickets.filter(
      (t) => (t.assigned_to === u.id || t.assignedTo === u.id) && (t.status || "").toLowerCase() !== "resolved"
    ).length;

    return {
      ...u,
      activeCount,
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2 text-slate-100 font-sans antialiased">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white/90">System Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time telemetry, operational department distribution, and ticket status.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono tracking-wide text-emerald-400 uppercase">Live Metrics</span>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 transition-all duration-200 hover:border-white/20">
          <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">Total Volume</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {isLoadingTickets ? "—" : totalTickets}
            </span>
            <Sparkline color="#8b5cf6" values={[totalTickets, totalTickets + 2, totalTickets + 5, totalTickets]} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">All recorded ticket entries</p>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 transition-all duration-200 hover:border-white/20">
          <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">Resolution Rate</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
              {isLoadingTickets ? "—" : `${resolutionRate}%`}
            </span>
            <Sparkline color="#10b981" values={[40, 65, 80, resolutionRate]} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Resolved vs total ratio</p>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 transition-all duration-200 hover:border-white/20">
          <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">Active Workforce</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-sky-400">
              {isLoadingUsers ? "—" : users.length}
            </span>
            <Sparkline color="#38bdf8" values={[users.length, users.length, users.length]} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Registered system users</p>
        </div>

        {/* Card 4 */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 transition-all duration-200 hover:border-white/20">
          <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">High Priority / Critical</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-rose-400">
              {isLoadingTickets ? "—" : criticalTickets}
            </span>
            <Sparkline color="#f43f5e" values={[2, 5, 3, criticalTickets]} />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Requires immediate action</p>
        </div>
      </div>

      {/* ── Main Dashboard Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Department Breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Department Breakdown</h2>
              <p className="text-[11px] text-slate-400">Distribution and queue status across registered units</p>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{deptMap.length} Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-slate-400 border-b border-white/10 text-[10px] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Open</th>
                  <th className="px-5 py-3">Resolved</th>
                  <th className="px-5 py-3 w-36">Total Load Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {isLoadingDepts ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-slate-500">Loading department telemetry...</td>
                  </tr>
                ) : deptMap.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-slate-500">No department records retrieved.</td>
                  </tr>
                ) : (
                  deptMap.map((dept) => (
                    <tr key={dept.id || dept.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-white">{dept.name}</td>
                      <td className="px-5 py-3.5 font-mono text-amber-400">{dept.open}</td>
                      <td className="px-5 py-3.5 font-mono text-emerald-400">{dept.resolved}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${dept.pct}%` }}></div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{dept.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User / Agent Workload */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">System Users & Active Workload</h2>
              <p className="text-[11px] text-slate-400">Assigned active tickets per registered user</p>
            </div>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto max-h-[380px] divide-y divide-white/5">
            {isLoadingUsers ? (
              <p className="text-xs text-slate-500 text-center py-4">Loading user workforce...</p>
            ) : userMap.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No users found.</p>
            ) : (
              userMap.map((u) => {
                const name = u.name || u.email || "Unknown";
                const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

                return (
                  <div key={u.id || u.email} className="pt-3 first:pt-0 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-violet-300 font-bold text-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{u.role || u.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {u.activeCount} active
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Pending Ticket Queue ── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <h2 className="text-sm font-semibold text-white">Pending Action Required</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{pendingTickets.length} Unresolved</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/10 text-[10px] uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3">ID / Reference</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {isLoadingTickets ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">Fetching ticket queue...</td>
                </tr>
              ) : pendingTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500">No pending tickets requiring action.</td>
                </tr>
              ) : (
                pendingTickets.slice(0, 5).map((ticket) => {
                  const priority = (ticket.priority || "Normal").toLowerCase();
                  const badgeColor =
                    priority === "critical" || priority === "high"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-slate-500/10 text-slate-300 border-slate-500/20";

                  return (
                    <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                        #{ticket.id?.toString().slice(-6)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-white max-w-xs truncate">
                        {ticket.subject || ticket.title || "No Subject Provided"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${badgeColor}`}>
                          {ticket.priority || "Normal"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                          {ticket.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-400 text-[11px] font-mono">
                        {ticket.created_at || ticket.createdAt ? new Date(ticket.created_at || ticket.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}