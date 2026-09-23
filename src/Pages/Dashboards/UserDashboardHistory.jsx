/* eslint-disable no-unused-vars */
// src/Pages/Dashboards/UserDashboardHistory.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Changes vs. original:
//  • Imports useUnread() context
//  • Batch-fetches replies for all tickets so we can compute unread counts
//  • Applies UnreadRowIndicator / ActionRequiredChip / UnreadBadge on each row
//  • Bold + brightened subject line when a row has unread replies
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { axiosInstance } from "../../Hooks/UseAxiosSecure";
import UseAuth from "../../Hooks/UseAuth";
import { useUnread } from "../../Context/UnreadContext";
import {
  UnreadBadge,
  UnreadRowIndicator,
  ActionRequiredChip,
} from "../../Components/UnreadBadge";
import QuickFeedbackModal from "../../Components/TicketFeedback/QuickFeedbackModal";
import { parseFeedbackComment } from "../../Utilities/feedback.utils";

// ── Static option lists & Configs ─────────────────────────────────────────────
const PRIORITIES = [
  { value: "Low", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { value: "Medium", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  { value: "High", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  { value: "Critical", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

const PRIORITY_CONFIG = {
  Low: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  Medium: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  High: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  Critical: {
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
};

const STATUS_CONFIG = {
  Open: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    dot: "bg-violet-400",
  },
  "In Progress": {
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    dot: "bg-sky-400 animate-pulse",
  },
  Pending: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  Resolved: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  Closed: {
    text: "text-zinc-400",
    bg: "bg-zinc-800/60",
    border: "border-zinc-700/50",
    dot: "bg-zinc-500",
  },
};

const INIT_FORM = {
  subject: "",
  description: "",
  priority: "",
  department: "",
  helpTopic: "",
  mobile: "",
  room: "",
  pabx: "",
  building: "",
  attachment: null,
};

const inputCls =
  "w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white " +
  "text-xs placeholder:text-zinc-500 focus:outline-none " +
  "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-colors";

const toolbarBtnCls =
  "w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 text-xs " +
  "hover:text-violet-400 hover:bg-violet-500/10 transition-colors cursor-pointer " +
  "focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/40";

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

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Sub-components ─────────────────────────────────────────────────────────────
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

const FieldLabel = ({ children }) => (
  <p className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase mb-1">
    {children}
  </p>
);

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
        </div>
      </div>
    ))}
  </div>
);

// ── Create Ticket Modal ────────────────────────────────────────────────────────
const CreateTicketModal = ({ isOpen, onClose, dbUserData, onSuccess }) => {
  const { user } = UseAuth();
  const [form, setForm] = useState(INIT_FORM);
  const [departments, setDepartments] = useState([]);
  const [helpTopics, setHelpTopics] = useState([]);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    axiosInstance
      .get("/api/departments")
      .then((res) => {
        const data = res.data?.data ?? [];
        setDepartments(
          data.map((d) => ({ value: d.id, label: d.department_title })),
        );
      })
      .catch(console.error);
    axiosInstance
      .get("/api/help-topics")
      .then((res) => {
        const data = res.data?.data ?? [];
        setHelpTopics(data.map((t) => ({ value: t.id, label: t.topic_title })));
      })
      .catch(console.error);
  }, [isOpen]);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const handleChange = (e) => setField(e.target.name, e.target.value);

  const resetAndClose = () => {
    setForm(INIT_FORM);
    setFileError("");
    setSubmitError("");
    onClose();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFileError(
        `"${file.name}" is ${formatBytes(file.size)} — max is 2 MB.`,
      );
      e.target.value = "";
      return;
    }
    setFileError("");
    setField("attachment", file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.priority) {
      setSubmitError("Please select a ticket priority.");
      return;
    }
    if (!form.description?.trim()) {
      setSubmitError("Please provide a description.");
      textareaRef.current?.focus();
      return;
    }

    const payload = {
      user_id: dbUserData?.id,
      subject: form.subject,
      description: form.description.trim(),
      priority: form.priority.toUpperCase(),
      department_id: form.department,
      help_topic_id: form.helpTopic,
      mobile: form.mobile,
      room: form.room || undefined,
      pabx: form.pabx || undefined,
      building_name: form.building || undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/api/tickets", payload);
      const ticket = res.data?.data ?? null;
      resetAndClose();
      onSuccess();
      await Swal.fire({
        icon: "success",
        title: "Ticket Submitted!",
        html: ticket?.ticket_number
          ? `Your ticket <strong>${ticket.ticket_number}</strong> has been created.`
          : "Your support ticket has been dispatched.",
        confirmButtonText: "Got it",
        background: "#181825",
        color: "#f1f5f9",
        confirmButtonColor: "#7c3aed",
        customClass: { popup: "rounded-2xl border border-zinc-800" },
      });
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.join(", ") ||
          "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col my-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  Create Support Ticket
                </h2>
                <p className="text-xs text-zinc-400">
                  Fill out the details below to open a ticket
                </p>
              </div>
              <button
                onClick={resetAndClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                <img
                  src={user?.photoURL || ""}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-700 shrink-0"
                />
                <div className="text-xs">
                  <p className="font-medium text-zinc-200">
                    {user?.displayName || "Authenticated User"}
                  </p>
                  <p className="text-zinc-400">{user?.email}</p>
                </div>
              </div>

              <div>
                <FieldLabel>Subject</FieldLabel>
                <input
                  className={inputCls}
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Brief summary of the issue"
                  required
                />
              </div>

              <div>
                <FieldLabel>Priority</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map(({ value, color, bg }) => {
                    const active = form.priority === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setField("priority", value);
                          if (submitError) setSubmitError("");
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none"
                        style={{
                          color: active ? color : "rgba(255,255,255,0.4)",
                          background: active ? bg : "transparent",
                          borderColor: active
                            ? `${color}50`
                            : "rgba(255,255,255,0.1)",
                        }}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Department</FieldLabel>
                  <select
                    className={inputCls}
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    {departments.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <select
                    className={inputCls}
                    name="helpTopic"
                    value={form.helpTopic}
                    onChange={handleChange}
                    required
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {helpTopics.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Mobile</FieldLabel>
                  <input
                    className={inputCls}
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="017XXXXXXXX"
                    type="tel"
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Room / Lab</FieldLabel>
                  <input
                    className={inputCls}
                    name="room"
                    value={form.room}
                    onChange={handleChange}
                    placeholder="Room number"
                    required
                  />
                </div>
                <div>
                  <FieldLabel>PABX Extension</FieldLabel>
                  <input
                    className={inputCls}
                    name="pabx"
                    value={form.pabx}
                    onChange={handleChange}
                    placeholder="PABX (optional)"
                    type="text"
                  />
                </div>
                <div>
                  <FieldLabel>Building</FieldLabel>
                  <input
                    className={inputCls}
                    name="building"
                    value={form.building}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Science Annex"
                    type="text"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Description Details</FieldLabel>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/25 transition-colors overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe your issue in detail..."
                    required
                    className="w-full bg-transparent px-3.5 pt-3 pb-2 text-white text-xs placeholder:text-zinc-500 focus:outline-none resize-y min-h-[100px]"
                  />
                  <div className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 border-t border-zinc-800/80 bg-zinc-950/40">
                    <div className="flex items-center gap-0.5">
                      <label
                        title="Attach a file (max 2 MB)"
                        className={toolbarBtnCls}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFile}
                        />
                      </label>
                    </div>
                    {form.attachment && (
                      <span className="flex items-center gap-1.5 ml-auto text-[11px] text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 rounded-md px-2 py-0.5">
                        <span className="truncate max-w-[140px]">
                          {form.attachment.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setField("attachment", null)}
                          className="hover:text-white"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                {fileError && (
                  <p className="text-[11px] text-rose-400 mt-1">{fileError}</p>
                )}
              </div>

              {submitError && (
                <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ── Main Dashboard History Component ──────────────────────────────────────────
const UserDashboardHistory = () => {
  const { user } = UseAuth();
  const queryClient = useQueryClient();
  const { getUnreadState } = useUnread();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackModalTicket, setFeedbackModalTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // 1. Fetch DB User Profile
  const { data: dbUserData, isLoading: isUserLoading } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/users?email=${encodeURIComponent(user.email)}`,
      );
      return res.data?.data || null;
    },
    enabled: !!user?.email,
    staleTime: 1000 * 60 * 15,
  });

  // 1b. Fetch all users to resolve assigned agent names
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/users");
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Fetch Tickets
  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    isFetching,
  } = useQuery({
    queryKey: ["tickets", dbUserData?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/api/tickets?user_id=${encodeURIComponent(dbUserData.id)}`,
      );
      const data = res.data?.data || [];
      if (typeof window !== "undefined")
        localStorage.setItem("user_ticket_count", String(data.length));
      return data;
    },
    enabled: !!dbUserData?.id,
    staleTime: 1000 * 60 * 2,
  });

  // 3. Batch-fetch replies for all open tickets (to compute unread counts)
  //    We poll every 30s so notifications stay live without a websocket.
  const openTicketIds = useMemo(
    () =>
      tickets
        .filter((t) => t.status?.toUpperCase() !== "COMPLETE")
        .map((t) => t.id),
    [tickets],
  );

  const { data: repliesMap = {} } = useQuery({
    queryKey: ["all-replies", openTicketIds.join(",")],
    queryFn: async () => {
      if (!openTicketIds.length) return {};
      const results = await Promise.allSettled(
        openTicketIds.map((id) =>
          axiosInstance.get(`/api/ticket-replies/ticket/${id}`).then((r) => ({
            id,
            replies: r.data?.data || r.data || [],
          })),
        ),
      );
      const map = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          map[result.value.id] = result.value.replies;
        }
      }
      return map;
    },
    enabled: openTicketIds.length > 0,
    refetchInterval: 30_000, // poll every 30 s for live-ish notifications
    staleTime: 20_000,
  });

  // 3b. Batch-fetch feedback for completed tickets
  const completedTicketIds = useMemo(
    () =>
      tickets
        .filter((t) => {
          const s = t.status?.toUpperCase();
          return s === "COMPLETE" || s === "COMPLETED" || s === "RESOLVED";
        })
        .map((t) => t.id),
    [tickets],
  );

  const { data: feedbackMap = {} } = useQuery({
    queryKey: ["all-feedback", completedTicketIds.join(",")],
    queryFn: async () => {
      if (!completedTicketIds.length) return {};
      const results = await Promise.allSettled(
        completedTicketIds.map((id) =>
          axiosInstance.get(`/api/ticket-feedback/ticket/${id}`).then((r) => ({
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
    enabled: completedTicketIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // 4. Dynamic Skeleton
  const cachedCount = useMemo(() => {
    if (tickets.length > 0) return tickets.length;
    if (typeof window !== "undefined") {
      const saved = Number(localStorage.getItem("user_ticket_count"));
      if (saved > 0) return saved;
    }
    return 3;
  }, [tickets.length]);

  // 5. Help Topics
  const topicIds = useMemo(
    () => [...new Set(tickets.map((t) => t.help_topic_id).filter(Boolean))],
    [tickets],
  );

  const { data: helpTopicsMap = {} } = useQuery({
    queryKey: ["helpTopics", topicIds],
    queryFn: async () => {
      if (!topicIds.length) return {};
      const results = await Promise.all(
        topicIds.map((id) =>
          axiosInstance
            .get(`/api/help-topics/${id}`)
            .then((res) => {
              if (res.data?.success) {
                const topic = Array.isArray(res.data.data)
                  ? res.data.data[0]
                  : res.data.data;
                return { id, title: topic?.topic_title || topic?.name || null };
              }
              return { id, title: null };
            })
            .catch(() => ({ id, title: null })),
        ),
      );
      const map = {};
      results.forEach(({ id, title }) => {
        if (title) map[id] = title;
      });
      return map;
    },
    enabled: topicIds.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  // 6. Cancel Ticket Mutation
  const { mutate: cancelTicket, variables: activeDeletingId } = useMutation({
    mutationFn: async (ticketId) => {
      const res = await axiosInstance.delete(`/api/tickets/${ticketId}`);
      return res.data;
    },
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({
        queryKey: ["tickets", dbUserData?.id],
      });
      const previousTickets = queryClient.getQueryData([
        "tickets",
        dbUserData?.id,
      ]);
      queryClient.setQueryData(["tickets", dbUserData?.id], (old = []) =>
        old.filter((t) => t.id !== ticketId),
      );
      return { previousTickets };
    },
    onError: (err, ticketId, context) => {
      if (context?.previousTickets)
        queryClient.setQueryData(
          ["tickets", dbUserData?.id],
          context.previousTickets,
        );
      Swal.fire({
        icon: "error",
        title: "Cancellation Failed",
        text: "Could not cancel ticket.",
        background: "#181825",
        color: "#f1f5f9",
        confirmButtonColor: "#f43f5e",
        customClass: { popup: "rounded-2xl border border-zinc-800" },
      });
    },
    onSuccess: () =>
      Swal.fire({
        icon: "success",
        title: "Ticket Cancelled",
        timer: 2000,
        showConfirmButton: false,
        background: "#181825",
        color: "#f1f5f9",
        customClass: { popup: "rounded-2xl border border-zinc-800" },
      }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["tickets", dbUserData?.id] }),
  });

  const handleCancelClick = (ticketId, ticketNumber) => {
    Swal.fire({
      title: "Cancel this ticket?",
      text: ticketNumber
        ? `Cancel ticket #${ticketNumber}?`
        : "Cancel this ticket?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No, keep it",
      background: "#181825",
      color: "#f1f5f9",
      confirmButtonColor: "#f43f5e",
      cancelButtonColor: "#27272a",
      customClass: {
        popup: "rounded-2xl border border-zinc-800",
        confirmButton: "rounded-xl font-medium px-4 py-2 text-xs",
        cancelButton:
          "rounded-xl font-medium px-4 py-2 text-xs text-zinc-300 border border-zinc-700",
      },
    }).then((result) => {
      if (result.isConfirmed) cancelTicket(ticketId);
    });
  };

  const totalUnread = useMemo(() => {
    let count = 0;
    for (const ticket of tickets) {
      const state = getUnreadState(ticket.id, repliesMap[ticket.id] ?? []);
      count += state.unreadCount;
    }
    return count;
  }, [tickets, repliesMap, getUnreadState]);

  // 8. Filtered tickets & counts
  const activeCount = useMemo(() => {
    return tickets.filter((t) => {
      const s = (t.status || "").toUpperCase();
      return (
        s !== "COMPLETE" &&
        s !== "COMPLETED" &&
        s !== "RESOLVED" &&
        s !== "CLOSED"
      );
    }).length;
  }, [tickets]);

  const resolvedCount = useMemo(() => {
    return tickets.filter((t) => {
      const s = (t.status || "").toUpperCase();
      return (
        s === "COMPLETE" ||
        s === "COMPLETED" ||
        s === "RESOLVED" ||
        s === "CLOSED"
      );
    }).length;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const s = (ticket.status || "").toUpperCase();
      const isResolved =
        s === "COMPLETE" ||
        s === "COMPLETED" ||
        s === "RESOLVED" ||
        s === "CLOSED";
      const isActive = !isResolved;
      const unread = getUnreadState(
        ticket.id,
        repliesMap[ticket.id] ?? [],
      ).hasUnread;

      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "resolved" && !isResolved) return false;
      if (statusFilter === "unread" && !unread) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (ticket.ticket_number || `TKT-${ticket.id}`).toLowerCase();
        const subj = (ticket.subject || "").toLowerCase();
        const desc = (ticket.description || "").toLowerCase();
        const dept = (ticket.department || "").toLowerCase();
        const topic = (helpTopicsMap[ticket.help_topic_id] || "").toLowerCase();
        const agent = (
          users.find((u) => u.id === ticket.assigned_to)?.name || ""
        ).toLowerCase();

        return (
          num.includes(q) ||
          subj.includes(q) ||
          desc.includes(q) ||
          dept.includes(q) ||
          topic.includes(q) ||
          agent.includes(q)
        );
      }

      return true;
    });
  }, [
    tickets,
    statusFilter,
    searchQuery,
    getUnreadState,
    repliesMap,
    helpTopicsMap,
    users,
  ]);

  const isLoading = isUserLoading || isTicketsLoading;

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              Support History
            </h1>
            {isFetching && !isLoading && (
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            )}
            {/* Total unread pill in the header */}
            {totalUnread > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[11px] font-semibold"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400" />
                </span>
                {totalUnread} unread {totalUnread === 1 ? "reply" : "replies"}
              </motion.span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Track, review, and manage your support tickets
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs text-zinc-400 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 font-mono font-medium">
            {tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Ticket
          </button>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      {tickets.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800/80 overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "all"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "active"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("resolved")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "resolved"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Resolved ({resolvedCount})
            </button>
            {totalUnread > 0 && (
              <button
                onClick={() => setStatusFilter("unread")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === "unread"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-violet-400 hover:text-violet-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                Unread ({totalUnread})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <svg
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-7 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <DynamicSkeleton count={cachedCount} />
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-3 border border-zinc-800">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-200">
            No support tickets found
          </p>
          <p className="text-xs text-zinc-500 mt-1 mb-4">
            When you submit a request, it will appear here.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Create your first ticket
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/20">
          <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-2 border border-zinc-800">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold text-zinc-300">
            No matching tickets
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5 mb-3">
            No tickets found for the selected filter or search term.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="text-xs font-medium text-violet-400 hover:text-violet-300 px-3 py-1 rounded-lg border border-violet-500/20 bg-violet-500/10 transition-colors cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {filteredTickets.map((ticket, index) => {
              const statusKey = capitalize(ticket.status);
              const resolution = calcResolution(
                ticket.created_at,
                ticket.completed_at,
              );
              const helpTopicName = helpTopicsMap[ticket.help_topic_id] ?? null;
              const isDeleting = activeDeletingId === ticket.id;

              // ── Unread state for this ticket ──────────────────────────────
              const ticketReplies = repliesMap[ticket.id] ?? [];
              const unreadState = getUnreadState(ticket.id, ticketReplies);
              const { hasUnread, unreadCount } = unreadState;

              return (
                <motion.div
                  key={ticket.ticket_number || ticket.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  {/* UnreadRowIndicator adds the left violet stripe when unread */}
                  <UnreadRowIndicator hasUnread={hasUnread}>
                    <div
                      className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
                        hasUnread
                          ? "border-violet-500/30 bg-zinc-900/70 hover:bg-zinc-900/90 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_4px_24px_rgba(139,92,246,0.08)]"
                          : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700/80"
                      }`}
                    >
                      <div className="p-4 sm:p-5">
                        {/* Top Row: Ticket ID & Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-xs font-medium tracking-wider ${hasUnread ? "text-violet-400" : "text-zinc-400"}`}
                            >
                              #{ticket.ticket_number || ticket.id}
                            </span>
                            {/* Unread count pill next to ticket number */}
                            {hasUnread && (
                              <UnreadBadge
                                count={unreadCount}
                                variant="compact"
                              />
                            )}
                            {ticket.department && (
                              <span className="text-xs text-zinc-500 font-normal">
                                / {ticket.department}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <PriorityBadge priority={ticket.priority} />
                            <StatusBadge status={ticket.status} />

                            {/* Completed ticket feedback button / badge */}
                            {(statusKey === "Resolved" ||
                              statusKey === "Complete" ||
                              ticket.status?.toUpperCase() === "COMPLETE") &&
                              (() => {
                                const existingFb = feedbackMap[ticket.id];
                                if (existingFb) {
                                  const parsed = parseFeedbackComment(
                                    existingFb.comment,
                                  );
                                  const isSatisfied =
                                    parsed.type === "Satisfied";
                                  return (
                                    <button
                                      onClick={() =>
                                        setFeedbackModalTicket(ticket)
                                      }
                                      title={
                                        parsed.note
                                          ? `Feedback: "${parsed.note}"`
                                          : `Rating: ${parsed.type}`
                                      }
                                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isSatisfied
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                                          : "bg-sky-500/10 text-sky-400 border-sky-500/25 hover:bg-sky-500/20"
                                      }`}
                                    >
                                      <span>
                                        {isSatisfied
                                          ? "⭐ Satisfied"
                                          : "✅ Done"}
                                      </span>
                                    </button>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() =>
                                      setFeedbackModalTicket(ticket)
                                    }
                                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer animate-pulse"
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                    >
                                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                    </svg>
                                    Give Feedback
                                  </button>
                                );
                              })()}

                            <Link
                              to={`/dashboard/ticket/${ticket.id}`}
                              className="text-xs font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20 transition-colors flex items-center gap-1.5"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              {hasUnread ? "Reply Now" : "View & Reply"}
                            </Link>

                            {ticket.status?.toLowerCase() === "pending" && (
                              <button
                                onClick={() =>
                                  handleCancelClick(
                                    ticket.id,
                                    ticket.ticket_number,
                                  )
                                }
                                disabled={isDeleting}
                                className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 transition-colors disabled:opacity-40 cursor-pointer"
                              >
                                {isDeleting ? "Cancelling..." : "Cancel"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Subject / Title — bold when unread */}
                        <div className="flex items-center gap-2 mb-2">
                          <Link
                            to={`/dashboard/ticket/${ticket.id}`}
                            className={`block text-base transition-colors ${
                              hasUnread
                                ? "font-semibold text-white hover:text-violet-300"
                                : "font-medium text-zinc-100 hover:text-violet-300"
                            }`}
                          >
                            {helpTopicName || ticket.subject}
                          </Link>
                          {/* "Action Required" chip — inline with title */}
                          {hasUnread && (
                            <ActionRequiredChip count={unreadCount} />
                          )}
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5 text-zinc-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Opened {fmtDate(ticket.created_at)}
                          </span>

                          {ticket.assigned_to ? (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                <span className="text-zinc-400">Agent:</span>
                                <strong className="font-medium text-zinc-200">
                                  {users.find(
                                    (u) => u.id === ticket.assigned_to,
                                  )?.name ||
                                    ticket.assigned_to_name ||
                                    `Agent #${ticket.assigned_to}`}
                                </strong>
                              </span>
                            </>
                          ) : statusKey === "Pending" ||
                            statusKey === "Open" ? (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="text-amber-400/90 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Awaiting assignment
                              </span>
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

                          {/* Timestamp of latest unread reply */}
                          {hasUnread && unreadState.latestUnreadAt && (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="text-violet-400/80 font-medium">
                                Last reply{" "}
                                {new Date(
                                  unreadState.latestUnreadAt,
                                ).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
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

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dbUserData={dbUserData}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: ["tickets", dbUserData?.id],
          })
        }
      />

      {/* Quick Feedback Modal */}
      <QuickFeedbackModal
        isOpen={!!feedbackModalTicket}
        ticket={feedbackModalTicket}
        currentUser={dbUserData}
        onClose={() => setFeedbackModalTicket(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["all-feedback"] });
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
        }}
      />
    </div>
  );
};

export default UserDashboardHistory;
