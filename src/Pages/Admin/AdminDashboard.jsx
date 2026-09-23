import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import Swal from "sweetalert2";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";
import { parseFeedbackComment } from "../../Utilities/feedback.utils";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

// ── SweetAlert2 Theme ─────────────────────────────────────────────────────────
const swalTheme = {
  background: "#0d0c1d",
  color: "#e2e0f0",
  confirmButtonColor: "#7c3aed",
  cancelButtonColor: "rgba(255,255,255,0.08)",
  customClass: {
    popup: "swal-popup-custom",
    title: "swal-title-custom",
    htmlContainer: "swal-html-custom",
    confirmButton: "swal-confirm-custom",
    cancelButton: "swal-cancel-custom",
    icon: "swal-icon-custom",
  },
};

// Inject SweetAlert2 custom CSS once
if (
  typeof document !== "undefined" &&
  !document.getElementById("swal-custom-styles")
) {
  const style = document.createElement("style");
  style.id = "swal-custom-styles";
  style.textContent = `
    .swal-popup-custom {
      border: 1px solid rgba(139,92,246,0.2) !important;
      border-radius: 20px !important;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08) !important;
      padding: 28px 28px 24px !important;
    }
    .swal-title-custom {
      font-size: 16px !important;
      font-weight: 700 !important;
      color: rgba(255,255,255,0.92) !important;
      letter-spacing: -0.01em !important;
      padding: 0 0 4px !important;
    }
    .swal-html-custom {
      font-size: 13px !important;
      color: rgba(255,255,255,0.45) !important;
      line-height: 1.6 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .swal-confirm-custom {
      border-radius: 12px !important;
      font-size: 12.5px !important;
      font-weight: 600 !important;
      padding: 9px 20px !important;
      border: none !important;
      letter-spacing: 0.01em !important;
      transition: all 0.15s ease !important;
    }
    .swal-confirm-custom:hover { filter: brightness(1.1) !important; }
    .swal-cancel-custom {
      border-radius: 12px !important;
      font-size: 12.5px !important;
      font-weight: 500 !important;
      padding: 9px 20px !important;
      color: rgba(255,255,255,0.55) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      transition: all 0.15s ease !important;
    }
    .swal-cancel-custom:hover {
      background: rgba(255,255,255,0.08) !important;
      color: rgba(255,255,255,0.8) !important;
    }
    .swal-icon-custom { margin: 0 0 12px !important; transform: scale(0.82) !important; }
    .swal2-actions { gap: 8px !important; margin-top: 20px !important; }
    .swal2-icon { border-width: 2px !important; }
    .swal2-icon.swal2-warning { border-color: rgba(251,191,36,0.5) !important; color: #fbbf24 !important; }
    .swal2-icon.swal2-question { border-color: rgba(139,92,246,0.5) !important; color: #a78bfa !important; }
    .swal2-icon.swal2-error { border-color: rgba(248,113,113,0.5) !important; color: #f87171 !important; }
    .swal2-icon.swal2-success { border-color: rgba(52,211,153,0.5) !important; color: #34d399 !important; }
    .swal2-icon.swal2-success [class^="swal2-success-line"] { background: #34d399 !important; }
    .swal2-icon.swal2-success .swal2-success-ring { border-color: rgba(52,211,153,0.3) !important; }
    .swal2-timer-progress-bar { background: rgba(139,92,246,0.6) !important; }
  `;
  document.head.appendChild(style);
}

// ── SweetAlert Helpers ────────────────────────────────────────────────────────
const showToast = (icon, title, timer = 2200) =>
  Swal.fire({
    ...swalTheme,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    icon,
    title,
    customClass: {
      popup: "swal-popup-custom",
      title: "swal-title-custom",
    },
  });

const confirmDialog = ({
  title,
  html,
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon = "question",
  confirmColor = "#7c3aed",
}) =>
  Swal.fire({
    ...swalTheme,
    title,
    html,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmColor,
    reverseButtons: true,
    focusCancel: true,
  });

// ── Style Maps ────────────────────────────────────────────────────────────────
const PRIORITY_STYLE = {
  LOW: { color: "#34d399", bg: "rgba(52,211,153,0.12)", dot: "#34d399" },
  MEDIUM: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", dot: "#60a5fa" },
  HIGH: { color: "#fb923c", bg: "rgba(251,146,60,0.12)", dot: "#fb923c" },
  CRITICAL: { color: "#f87171", bg: "rgba(248,113,113,0.12)", dot: "#f87171" },
  URGENT: { color: "#f87171", bg: "rgba(248,113,113,0.12)", dot: "#f87171" },
};

const STATUS_STYLE = {
  PENDING: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  IN_PROGRESS: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  COMPLETE: { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "COMPLETE"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const FILTER_STATUSES = ["All", "PENDING", "IN_PROGRESS", "COMPLETE"];
const FILTER_LABELS = {
  All: "All",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3.5 py-2 text-white " +
  "text-[12.5px] focus:outline-none focus:border-violet-500/50 transition-colors";

// ── Ticket Stats Chart ────────────────────────────────────────────────────────
const TicketStatsChart = ({ tickets }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const total = tickets.length;
  const pending = tickets.filter((t) => t.status === "PENDING").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const complete = tickets.filter((t) => t.status === "COMPLETE").length;

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: ["Total", "Pending", "Active", "Complete"],
        datasets: [
          {
            data: [total, pending, inProgress, complete],
            backgroundColor: [
              "rgba(139,92,246,0.75)",
              "rgba(251,191,36,0.75)",
              "rgba(96,165,250,0.75)",
              "rgba(52,211,153,0.75)",
            ],
            hoverBackgroundColor: [
              "rgba(139,92,246,1)",
              "rgba(251,191,36,1)",
              "rgba(96,165,250,1)",
              "rgba(52,211,153,1)",
            ],
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.55,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(13,12,29,0.95)",
            borderColor: "rgba(139,92,246,0.3)",
            borderWidth: 1,
            titleColor: "rgba(255,255,255,0.5)",
            bodyColor: "#c4b5fd",
            titleFont: { size: 10, family: "monospace" },
            bodyFont: { size: 12, weight: "bold" },
            padding: 8,
            callbacks: {
              label: (item) => `${item.raw} ticket${item.raw !== 1 ? "s" : ""}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: "rgba(255,255,255,0.35)", font: { size: 11 } },
          },
          y: {
            display: false,
            grid: { display: false },
            border: { display: false },
            min: 0,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [total, pending, inProgress, complete]);

  return <canvas ref={canvasRef} />;
};

// ── Sidebar Panel ─────────────────────────────────────────────────────────────
const SidePanel = ({ tickets = [], users = [] }) => {
  const activeTickets = tickets.filter(
    (t) => t.assigned_to != null && t.status !== "COMPLETE",
  );

  const assignedCountMap = {};
  activeTickets.forEach((t) => {
    assignedCountMap[t.assigned_to] =
      (assignedCountMap[t.assigned_to] ?? 0) + 1;
  });

  const assignedUserIds = new Set(Object.keys(assignedCountMap).map(Number));
  const assignedAgents = users.filter((u) => assignedUserIds.has(u.id));
  const availableAgents = users.filter((u) => !assignedUserIds.has(u.id));

  const displayAgents = [
    ...assignedAgents.map((u) => ({
      ...u,
      busy: true,
      count: assignedCountMap[u.id] ?? 0,
    })),
    ...availableAgents.map((u) => ({ ...u, busy: false, count: 0 })),
  ];

  return (
    <aside className="w-full mt-6 md:mt-0 lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-0 rounded-2xl border border-white/[0.07] shadow-xl bg-[#0a0915] overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <h2 className="text-[16px] font-bold text-white">Ticket Overview</h2>
        <p className="text-[11px] text-white/35 mt-0.5">Live status snapshot</p>
      </div>

      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
            Ticket Breakdown
          </span>
          <span className="text-[13px] font-bold text-violet-400">
            {tickets.length} total
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2.5">
          {[
            { label: "Total", color: "bg-violet-400" },
            { label: "Pending", color: "bg-amber-400" },
            { label: "Active", color: "bg-blue-400" },
            { label: "Complete", color: "bg-emerald-400" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-sm shrink-0 ${color} opacity-80`}
              />
              <span className="text-[10.5px] text-white/40">{label}</span>
            </div>
          ))}
        </div>

        <div className="h-[140px]">
          <TicketStatsChart tickets={tickets} />
        </div>
      </div>

      <div className="px-5 pt-4 pb-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
            Agents
          </p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-amber-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {assignedAgents.length} assigned
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {availableAgents.length} free
            </span>
          </div>
        </div>

        {displayAgents.length === 0 ? (
          <p className="text-[12px] text-white/25 text-center py-4">
            No agents found.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-0.5">
            {displayAgents.map((agent) => {
              const initials = agent.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              return (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full shrink-0 bg-gradient-to-br from-violet-500/40 to-violet-900/60 border border-violet-500/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-violet-300">
                      {initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-white/85 truncate">
                      {agent.name}
                    </p>
                    <p className="text-[10.5px] text-white/35 truncate">
                      {agent.email}
                    </p>
                  </div>
                  {agent.busy ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 whitespace-nowrap">
                      {agent.count} ticket{agent.count !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Available
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

// ── Assign User Modal ─────────────────────────────────────────────────────────
const AssignModal = ({ users = [], isLoading, ticket, onSelect, onClose }) => {
  const [search, setSearch] = useState("");
  const [pendingUserId, setPendingUserId] = useState(undefined);
  const [note, setNote] = useState("");
  const NOTE_LIMIT = 300;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );
  const assignedUser = users.find((u) => u.id === ticket.assigned_to);
  const pendingUser = pendingUserId
    ? users.find((u) => u.id === pendingUserId)
    : null;
  const isNoteStep = pendingUserId !== undefined;

  const stageUser = (userId) => {
    if (userId === pendingUserId) {
      setPendingUserId(undefined);
      setNote("");
      return;
    }
    setPendingUserId(userId ?? null);
    setNote("");
  };

  const handleConfirm = async () => {
    const isUnassigning = pendingUserId === null && ticket.assigned_to;
    const isReassigning =
      pendingUserId &&
      ticket.assigned_to &&
      pendingUserId !== ticket.assigned_to;

    let title, html, confirmText, icon, confirmColor;

    if (isUnassigning) {
      title = "Remove Assignment";
      html = `Remove <strong style="color:#e2e0f0">${assignedUser?.name}</strong> from <span style="color:#a78bfa;font-family:monospace">${ticket.ticket_number}</span>?`;
      confirmText = "Remove";
      icon = "warning";
      confirmColor = "#f59e0b";
    } else if (isReassigning) {
      title = "Reassign Ticket";
      html = `Switch from <strong style="color:#e2e0f0">${assignedUser?.name}</strong> to <strong style="color:#a78bfa">${pendingUser?.name}</strong>?`;
      confirmText = "Reassign";
      icon = "question";
      confirmColor = "#7c3aed";
    } else {
      title = "Assign Agent";
      html = `Assign <strong style="color:#a78bfa">${pendingUser?.name}</strong> to <span style="color:#a78bfa;font-family:monospace">${ticket.ticket_number}</span>?`;
      confirmText = "Assign";
      icon = "question";
      confirmColor = "#7c3aed";
    }

    const result = await confirmDialog({
      title,
      html,
      confirmText,
      icon,
      confirmColor,
    });
    if (result.isConfirmed) {
      onSelect(pendingUserId, note.trim() || null);
      showToast(
        "success",
        isUnassigning
          ? "Assignment removed"
          : `Assigned to ${pendingUser?.name}`,
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-sm bg-[#0d0c1d] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.07]">
          <div>
            <h3 className="text-[14px] font-bold text-white">Assign Agent</h3>
            <p className="text-[11px] text-white/35 mt-0.5 font-mono">
              {ticket.ticket_number}
            </p>
            <p className="text-[11.5px] text-white/50 mt-1 truncate max-w-[220px]">
              {ticket.subject}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors shrink-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Currently assigned pill ── */}
        {assignedUser && (
          <div className="mx-4 mt-3 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: "rgba(139,92,246,0.4)", color: "#c4b5fd" }}
            >
              {assignedUser.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] text-violet-300 font-medium truncate">
                Currently: {assignedUser.name}
              </p>
              <p className="text-[10.5px] text-violet-400/60 truncate">
                {assignedUser.email}
              </p>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
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
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-white/[0.05] rounded-xl pl-8 pr-3 py-2 text-[12.5px] text-white placeholder-white/25 focus:outline-none border border-white/[0.08] focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        {/* ── User list ── */}
        <div className="px-2 pb-2 max-h-56 overflow-y-auto">
          {/* Unassign row */}
          <button
            onClick={() => stageUser(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors mb-0.5 ${
              pendingUserId === null
                ? "bg-violet-500/15 border border-violet-500/25"
                : !ticket.assigned_to
                  ? "bg-white/[0.06]"
                  : "hover:bg-white/[0.04]"
            }`}
          >
            <span className="w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.1] flex items-center justify-center text-[13px] text-white/30 shrink-0">
              —
            </span>
            <div>
              <p className="text-[12.5px] text-white/50 font-medium">
                Unassigned
              </p>
              <p className="text-[11px] text-white/25">
                Remove current assignment
              </p>
            </div>
            {(pendingUserId === null ||
              (!ticket.assigned_to && pendingUserId === undefined)) && (
              <svg
                className="ml-auto text-violet-400 shrink-0"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <div className="mx-1 my-1.5 border-t border-white/[0.05]" />

          {isLoading ? (
            <div className="py-8 text-center">
              <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-white/25">
              No users match "{search}"
            </p>
          ) : (
            filtered.map((u) => {
              const isCurrentlyAssigned = ticket.assigned_to === u.id;
              const isStaged = pendingUserId === u.id;
              const initials = u.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              const roleColor =
                u.role === "admin"
                  ? { bg: "rgba(248,113,113,0.25)", text: "#fca5a5" }
                  : u.role === "agent"
                    ? { bg: "rgba(96,165,250,0.2)", text: "#93c5fd" }
                    : {
                        bg: "rgba(255,255,255,0.08)",
                        text: "rgba(255,255,255,0.35)",
                      };
              return (
                <button
                  key={u.id}
                  onClick={() => stageUser(u.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isStaged
                      ? "bg-violet-500/20 border border-violet-500/35"
                      : isCurrentlyAssigned
                        ? "bg-violet-500/10 border border-violet-500/20"
                        : "hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      background: "rgba(139,92,246,0.3)",
                      color: "#c4b5fd",
                    }}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-white/85 font-medium truncate">
                      {u.name}
                    </p>
                    <p className="text-[11px] text-white/35 truncate">
                      {u.email}
                    </p>
                  </div>
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize"
                    style={{ background: roleColor.bg, color: roleColor.text }}
                  >
                    {u.role ?? "user"}
                  </span>
                  {isStaged && (
                    <svg
                      className="text-violet-400 shrink-0"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* ── Note panel ── */}
        <AnimatePresence initial={false}>
          {isNoteStep && (
            <motion.div
              key="note-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pt-3 pb-4 border-t border-white/[0.07] bg-black/20">
                <div className="flex items-center gap-2 mb-2.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-violet-400 shrink-0"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span className="text-[10.5px] font-semibold text-violet-400/80 tracking-wide">
                    Assignment note
                    <span className="text-white/25 font-normal ml-1">
                      — optional, visible to assignee
                    </span>
                  </span>
                </div>

                {pendingUser && (
                  <div className="flex items-center gap-2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-violet-500/[0.08] border border-violet-500/15">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{
                        background: "rgba(139,92,246,0.35)",
                        color: "#c4b5fd",
                      }}
                    >
                      {pendingUser.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <p className="text-[11.5px] text-white/60 truncate">
                      Note will be sent to{" "}
                      <strong className="text-violet-300 font-semibold">
                        {pendingUser.name}
                      </strong>
                    </p>
                  </div>
                )}
                {pendingUserId === null && (
                  <div className="flex items-center gap-2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-amber-500/[0.07] border border-amber-500/15">
                    <p className="text-[11.5px] text-amber-400/70">
                      No note required when removing assignment.
                    </p>
                  </div>
                )}

                {pendingUserId !== null && (
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) =>
                        setNote(e.target.value.slice(0, NOTE_LIMIT))
                      }
                      placeholder={`e.g. "Please prioritise this — customer is waiting on a callback."`}
                      className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-white text-[12.5px] placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors resize-none leading-relaxed"
                    />
                    <span
                      className={`absolute bottom-2.5 right-3 text-[10px] tabular-nums ${note.length >= NOTE_LIMIT ? "text-red-400" : "text-white/20"}`}
                    >
                      {note.length}/{NOTE_LIMIT}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => {
                      setPendingUserId(undefined);
                      setNote("");
                    }}
                    className="text-[11.5px] text-white/35 hover:text-white/60 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {pendingUserId === null
                      ? "Remove assignment"
                      : "Confirm assignment"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const axios = UseAxiosSecure();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState("All");
  const [editingTicket, setEditingTicket] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [assignModalTicket, setAssignModalTicket] = useState(null);

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await axios.get("/api/tickets");
      return res.data.data ?? [];
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data.data ?? [];
    },
  });

  // ── FIX: Array.isArray guards prevent "tickets.filter is not a function"
  //    when ticketsData / usersData is undefined on the first render cycle.
  const tickets = useMemo(
    () => (Array.isArray(ticketsData) ? ticketsData : []),
    [ticketsData],
  );
  const users = useMemo(
    () => (Array.isArray(usersData) ? usersData : []),
    [usersData],
  );

  // Derived from `tickets` (the safe array above) — never from raw ticketsData
  const completedAdminTicketIds = useMemo(
    () => tickets.filter((t) => t.status === "COMPLETE").map((t) => t.id),
    [tickets],
  );

  const { data: feedbackMap = {} } = useQuery({
    queryKey: ["admin-feedback", completedAdminTicketIds.join(",")],
    queryFn: async () => {
      if (!completedAdminTicketIds.length) return {};
      const results = await Promise.allSettled(
        completedAdminTicketIds.map((id) =>
          axios.get(`/api/ticket-feedback/ticket/${id}`).then((r) => ({
            id,
            feedback: Array.isArray(r.data?.data)
              ? r.data.data[0]
              : r.data?.data || null,
          })),
        ),
      );
      const map = {};
      for (const res of results) {
        if (res.status === "fulfilled" && res.value?.feedback) {
          map[res.value.id] = res.value.feedback;
        }
      }
      return map;
    },
    enabled: completedAdminTicketIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      axios.patch(`/api/tickets/${id}/status`, { status }),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assigned_to, assignment_note }) =>
      axios.patch(`/api/tickets/${id}/assign`, {
        assigned_to,
        ...(assignment_note ? { assignment_note } : {}),
      }),
    onSuccess: () => {
      invalidate();
      setAssignModalTicket(null);
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, ...fields }) =>
      axios.patch(`/api/tickets/${id}`, fields),
    onSuccess: () => {
      invalidate();
      setEditingTicket(null);
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id) => axios.delete(`/api/tickets/${id}`),
    onSuccess: invalidate,
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (ticket, newStatus) => {
    const fromLabel = FILTER_LABELS[ticket.status] ?? ticket.status;
    const toLabel = FILTER_LABELS[newStatus] ?? newStatus;
    const toColor = STATUS_STYLE[newStatus]?.color ?? "#ffffff";
    const icon = newStatus === "COMPLETE" ? "success" : "question";

    const result = await confirmDialog({
      title: "Change Status",
      html: `Move <span style="color:#a78bfa;font-family:monospace">${ticket.ticket_number}</span> from <strong style="color:#e2e0f0">${fromLabel}</strong> to <strong style="color:${toColor}">${toLabel}</strong>?`,
      confirmText: `Set ${toLabel}`,
      icon,
      confirmColor: toColor,
    });

    if (result.isConfirmed) {
      updateStatusMutation.mutate(
        { id: ticket.id, status: newStatus },
        {
          onSuccess: () => showToast("success", `Status updated to ${toLabel}`),
        },
      );
    }
  };

  const handleCancelTicket = async (ticket) => {
    const result = await confirmDialog({
      title: "Delete Ticket",
      html: `This will permanently remove <span style="color:#a78bfa;font-family:monospace">${ticket.ticket_number}</span>.<br/><span style="color:rgba(248,113,113,0.7);font-size:12px">This action cannot be undone.</span>`,
      confirmText: "Delete",
      cancelText: "Keep it",
      icon: "error",
      confirmColor: "#dc2626",
    });

    if (result.isConfirmed) {
      deleteTicketMutation.mutate(ticket.id, {
        onSuccess: () => showToast("success", "Ticket deleted"),
      });
    }
  };

  const handleAssign = (ticketId, userId, note) =>
    assignMutation.mutate({
      id: ticketId,
      assigned_to: userId,
      assignment_note: note,
    });

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const { id, _original, status, priority, assigned_to } = editingTicket;
    const changes = {};
    if (status !== _original.status) changes.status = status;
    if (priority !== _original.priority) changes.priority = priority;
    if (assigned_to !== _original.assigned_to)
      changes.assigned_to = assigned_to ?? null;

    if (Object.keys(changes).length === 0) {
      setEditingTicket(null);
      return;
    }

    const changeLines = Object.entries(changes)
      .map(([key, val]) => {
        const label =
          key === "assigned_to"
            ? "Agent"
            : key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        const displayVal =
          key === "assigned_to"
            ? val
              ? (users.find((u) => u.id === val)?.name ?? `#${val}`)
              : "Unassigned"
            : (FILTER_LABELS[val] ?? val);
        return `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
        <span style="color:rgba(255,255,255,0.4);width:60px;text-align:right;font-size:11px">${label}</span>
        <span style="color:#a78bfa;font-size:11px">→</span>
        <strong style="color:#e2e0f0;font-size:11.5px">${displayVal}</strong>
      </div>`;
      })
      .join("");

    const result = await confirmDialog({
      title: "Save Changes",
      html: `<div style="text-align:left;margin-top:4px">${changeLines}</div>`,
      confirmText: "Save",
      icon: "question",
    });

    if (result.isConfirmed) {
      updateTicketMutation.mutate(
        { id, ...changes },
        {
          onSuccess: () => showToast("success", "Ticket updated successfully"),
        },
      );
    }
  };

  const filteredTickets =
    filterStatus === "All"
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  const stats = [
    {
      label: "Total",
      val: tickets.length,
      color: "text-white",
      accent: "bg-white/10",
      sub: "all time",
    },
    {
      label: "Pending",
      val: tickets.filter((t) => t.status === "PENDING").length,
      color: "text-amber-400",
      accent: "bg-amber-400/10",
      sub: "awaiting action",
    },
    {
      label: "Active",
      val: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      color: "text-violet-400",
      accent: "bg-violet-400/10",
      sub: "in progress",
    },
    {
      label: "Complete",
      val: tickets.filter((t) => t.status === "COMPLETE").length,
      color: "text-emerald-400",
      accent: "bg-emerald-400/10",
      sub: "resolved",
    },
  ];

  if (ticketsLoading) {
    return (
      <div className="flex gap-5">
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl border border-white/[0.07] bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl border border-white/[0.05] bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="hidden lg:block w-[300px] xl:w-[320px] h-[500px] rounded-2xl border border-white/[0.07] bg-white/[0.02] animate-pulse shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex-wrap md:flex gap-10 md:gap-5 items-start">
      {/* ── Left: Main Content ── */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Stat Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-white/40">
                  {stat.label}
                </p>
                <span className={`w-1.5 h-1.5 rounded-full ${stat.accent}`} />
              </div>
              <p className={`text-[28px] font-bold leading-none ${stat.color}`}>
                {stat.val}
              </p>
              <p className="text-[10.5px] text-white/25">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Header + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-white/90">
              Ticket Management
            </h2>
            <p className="text-[11.5px] text-white/35 mt-0.5">
              Assign agents, update status, or delete tickets
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.07] p-1 rounded-xl overflow-x-auto">
            {FILTER_STATUSES.map((status) => {
              const count =
                status === "All"
                  ? tickets.length
                  : tickets.filter((t) => t.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {FILTER_LABELS[status]}
                  <span
                    className={`text-[10px] tabular-nums ${filterStatus === status ? "text-violet-400" : "text-white/20"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0a0915] shadow-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            {["Ticket", "Priority", "Status", "Assigned", "Actions"].map(
              (h) => (
                <span
                  key={h}
                  className="text-[10.5px] font-semibold text-white/30 uppercase tracking-wider"
                >
                  {h}
                </span>
              ),
            )}
          </div>

          {filteredTickets.length === 0 ? (
            <div className="py-20 text-center text-white/20 text-[12px]">
              No tickets match the selected filter.
            </div>
          ) : (
            <div>
              {filteredTickets.map((ticket, i) => {
                const isExpanded = expandedId === ticket.id;
                const assignedUser = users.find(
                  (u) => u.id === ticket.assigned_to,
                );
                const priStyle = PRIORITY_STYLE[ticket.priority] ?? {};
                const stStyle = STATUS_STYLE[ticket.status] ?? {};

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.04] last:border-b-0"
                  >
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                      {/* Ticket Info */}
                      <div
                        className="min-w-0 cursor-pointer"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : ticket.id)
                        }
                      >
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-mono text-[10px] text-white/25 shrink-0">
                            {ticket.ticket_number}
                          </span>
                          <span className="text-[10px] text-white/25">·</span>
                          <span className="text-[10.5px] text-white/30 truncate">
                            Dept #{ticket.department_id}
                            {ticket.room ? ` · ${ticket.room}` : ""}
                          </span>
                          {ticket.status === "COMPLETE" &&
                            feedbackMap[ticket.id] &&
                            (() => {
                              const parsed = parseFeedbackComment(
                                feedbackMap[ticket.id].comment,
                              );
                              const isSatisfied = parsed.type === "Satisfied";
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                                    isSatisfied
                                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                      : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                  }`}
                                >
                                  {isSatisfied ? "⭐ Satisfied" : "✅ Done"}
                                </span>
                              );
                            })()}
                        </div>
                        <p className="text-[13px] font-medium text-white/85 truncate">
                          {ticket.subject}
                        </p>
                      </div>

                      {/* Priority */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: priStyle.dot }}
                        />
                        <span
                          className="text-[11px] font-semibold capitalize"
                          style={{ color: priStyle.color }}
                        >
                          {ticket.priority?.toLowerCase()}
                        </span>
                      </div>

                      {/* Status Select */}
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          handleStatusChange(ticket, e.target.value)
                        }
                        className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11.5px] focus:outline-none focus:border-violet-500/40 transition-colors cursor-pointer"
                        style={{ colorScheme: "dark", color: stStyle.color }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {FILTER_LABELS[s] ?? s}
                          </option>
                        ))}
                      </select>

                      {/* Assign Button */}
                      <button
                        onClick={() => setAssignModalTicket(ticket)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white/80 transition-colors text-[11.5px] whitespace-nowrap"
                      >
                        {assignedUser ? (
                          <>
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                              style={{
                                background: "rgba(139,92,246,0.4)",
                                color: "#c4b5fd",
                              }}
                            >
                              {assignedUser.name[0]}
                            </span>
                            {assignedUser.name.split(" ")[0]}
                          </>
                        ) : (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            Assign
                          </>
                        )}
                      </button>

                      {/* Edit + Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            setEditingTicket({
                              ...ticket,
                              _original: {
                                status: ticket.status,
                                priority: ticket.priority,
                                assigned_to: ticket.assigned_to,
                              },
                            })
                          }
                          title="Edit ticket"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white/45 hover:text-white/80 transition-colors"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleCancelTicket(ticket)}
                          title="Delete ticket"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.08] hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-colors"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Drawer */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-3 border-t border-white/[0.05] bg-black/20 text-[12.5px] space-y-3">
                            <div>
                              <span className="text-[10.5px] font-semibold text-white/35 uppercase tracking-wider block mb-1.5">
                                Description
                              </span>
                              <p className="text-white/70 bg-white/[0.03] p-3 rounded-xl border border-white/[0.05] leading-relaxed">
                                {ticket.description ||
                                  "No description provided."}
                              </p>
                            </div>

                            {ticket.assignment_note && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-violet-400/70 shrink-0"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  <span className="text-[10.5px] font-semibold text-violet-400/70 uppercase tracking-wider">
                                    Assignment note
                                  </span>
                                </div>
                                <p className="text-white/70 bg-violet-500/[0.07] p-3 rounded-xl border border-violet-500/20 leading-relaxed italic">
                                  "{ticket.assignment_note}"
                                </p>
                              </div>
                            )}

                            {ticket.status === "COMPLETE" && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#34d399"
                                      strokeWidth="2.5"
                                    >
                                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                    </svg>
                                    <span className="text-[10.5px] font-semibold text-emerald-400 uppercase tracking-wider">
                                      Customer Feedback
                                    </span>
                                  </div>
                                  {feedbackMap[ticket.id] &&
                                    (() => {
                                      const parsed = parseFeedbackComment(
                                        feedbackMap[ticket.id].comment,
                                      );
                                      const isSat = parsed.type === "Satisfied";
                                      return (
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            isSat
                                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                              : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                          }`}
                                        >
                                          {isSat ? "⭐ Satisfied" : "✅ Done"}
                                        </span>
                                      );
                                    })()}
                                </div>

                                {feedbackMap[ticket.id] ? (
                                  (() => {
                                    const parsed = parseFeedbackComment(
                                      feedbackMap[ticket.id].comment,
                                    );
                                    return (
                                      <div className="p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 text-white/80 space-y-1.5">
                                        {parsed.tags?.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {parsed.tags.map((t) => (
                                              <span
                                                key={t}
                                                className="px-1.5 py-0.5 rounded text-[9.5px] bg-emerald-500/20 text-emerald-300 font-medium"
                                              >
                                                ✓ {t}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        <p className="text-[12px] italic leading-relaxed">
                                          "{parsed.note ||
                                            "Confirmed resolved by customer."}"
                                        </p>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <p className="text-[11.5px] text-white/35 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05]">
                                    Awaiting customer feedback for this
                                    completed ticket.
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-4 text-[11.5px] text-white/40">
                              <span>
                                <strong className="text-white/60">
                                  Topic:
                                </strong>{" "}
                                #{ticket.help_topic_id}
                              </span>
                              <span>
                                <strong className="text-white/60">
                                  Mobile:
                                </strong>{" "}
                                {ticket.mobile ?? "N/A"}
                              </span>
                              <span>
                                <strong className="text-white/60">PABX:</strong>{" "}
                                {ticket.pabx ?? "N/A"}
                              </span>
                              <span>
                                <strong className="text-white/60">
                                  Created:
                                </strong>{" "}
                                {new Date(ticket.created_at).toLocaleString()}
                              </span>
                              {ticket.completed_at && (
                                <span>
                                  <strong className="text-white/60">
                                    Completed:
                                  </strong>{" "}
                                  {new Date(
                                    ticket.completed_at,
                                  ).toLocaleString()}
                                </span>
                              )}
                            </div>

                            <div className="pt-2 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2">
                              <a
                                href={`/admin/ticket/${ticket.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 text-[11.5px] font-medium transition-colors"
                              >
                                View full details & live replies →
                              </a>

                              {ticket.status === "COMPLETE" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(ticket, "IN_PROGRESS")
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 text-[11.5px] font-medium transition-colors"
                                >
                                  Reopen Ticket
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Side Panel ── */}
      <SidePanel tickets={tickets} users={users} />

      {/* ── Assign Modal ── */}
      <AnimatePresence>
        {assignModalTicket && (
          <AssignModal
            users={users}
            isLoading={usersLoading}
            ticket={assignModalTicket}
            onSelect={(userId, note) =>
              handleAssign(assignModalTicket.id, userId, note)
            }
            onClose={() => setAssignModalTicket(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
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
                <div>
                  <h3 className="text-[14px] font-bold text-white">
                    Edit Ticket
                  </h3>
                  <p className="text-[11px] text-white/30 font-mono mt-0.5">
                    {editingTicket.ticket_number}
                  </p>
                </div>
                <button
                  onClick={() => setEditingTicket(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="text-[11px] text-white/40 block mb-1">
                    Subject
                  </label>
                  <input
                    className={`${inputCls} opacity-60 cursor-not-allowed`}
                    value={editingTicket.subject}
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/40 block mb-1">
                      Priority
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRIORITY_OPTIONS.map((p) => {
                        const isActive = editingTicket.priority === p;
                        const s = PRIORITY_STYLE[p];
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setEditingTicket({
                                ...editingTicket,
                                priority: p,
                              })
                            }
                            className="py-1.5 rounded-lg text-[11px] font-semibold transition-all border"
                            style={{
                              color: isActive
                                ? s.color
                                : "rgba(255,255,255,0.3)",
                              background: isActive
                                ? s.bg
                                : "rgba(255,255,255,0.03)",
                              borderColor: isActive
                                ? s.color + "55"
                                : "rgba(255,255,255,0.07)",
                            }}
                          >
                            {p[0] + p.slice(1).toLowerCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-white/40 block mb-1">
                      Status
                    </label>
                    <select
                      className={inputCls}
                      value={editingTicket.status}
                      onChange={(e) =>
                        setEditingTicket({
                          ...editingTicket,
                          status: e.target.value,
                        })
                      }
                      style={{ colorScheme: "dark" }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {FILTER_LABELS[s] ?? s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-white/40 block mb-1">
                    Assigned Agent
                  </label>
                  <select
                    className={inputCls}
                    value={editingTicket.assigned_to ?? ""}
                    onChange={(e) =>
                      setEditingTicket({
                        ...editingTicket,
                        assigned_to: e.target.value
                          ? parseInt(e.target.value, 10)
                          : null,
                      })
                    }
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-white/40 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    readOnly
                    className={`${inputCls} opacity-60 cursor-not-allowed resize-none`}
                    value={editingTicket.description ?? ""}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTicket(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-white/[0.09] text-white/60 hover:bg-white/[0.05] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateTicketMutation.isPending}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-60"
                  >
                    {updateTicketMutation.isPending
                      ? "Saving…"
                      : "Save Changes"}
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