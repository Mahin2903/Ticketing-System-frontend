/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
// src/Pages/Dashboards/UserDashboard.jsx

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

import { axiosInstance } from "../../Hooks/UseAxiosSecure";
import Swal from "sweetalert2";
import UseAuth from "../../Hooks/UseAuth";

// const {user} = UseAuth();
// Debugging line to check user state

// ── Static option lists ───────────────────────────────────────────────────────
const PRIORITIES = [
  { value: "Low", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { value: "Medium", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  { value: "High", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  { value: "Critical", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

// ── Toolbar actions ───────────────────────────────────────────────────────────
const FORMAT_ACTIONS = [
  {
    id: "bold",
    label: "Bold",
    command: "bold",
    icon: <span className="font-bold">B</span>,
  },
  {
    id: "italic",
    label: "Italic",
    command: "italic",
    icon: <span className="italic">I</span>,
  },
  {
    id: "underline",
    label: "Underline",
    command: "underline",
    icon: <span className="underline">U</span>,
  },
  {
    id: "code",
    label: "Inline code",
    command: "code",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

// ── Shared class strings ──────────────────────────────────────────────────────
const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3 text-white " +
  "text-[13.5px] placeholder:text-white/25 focus:outline-none " +
  "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-colors";

const toolbarBtnCls =
  "w-7 h-7 rounded-lg flex items-center justify-center text-white/40 text-[12.5px] " +
  "hover:text-violet-400 hover:bg-violet-500/[0.12] transition-colors cursor-pointer " +
  "focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/40";

// ── Small helpers ─────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionCard = ({ number, title, subtitle, children }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
    <div className="flex items-center gap-3.5 px-6 py-4 border-b border-white/[0.06]">
      <span className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10.5px] font-bold text-violet-400 shrink-0">
        {number}
      </span>
      <div>
        <h2 className="text-[13.5px] font-semibold text-white/88">{title}</h2>
        {subtitle && (
          <p className="text-[11.5px] text-white/35 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const FieldLabel = ({ children }) => (
  <p className="text-[11px] font-semibold text-white/40 tracking-[0.1em] uppercase mb-1.5">
    {children}
  </p>
);

const ReadOnlyField = ({ value }) => (
  <div
    className={`${inputCls} bg-white/[0.02] text-white/45 cursor-default select-none`}
  >
    {value || "—"}
  </div>
);

// ── Initial form state ────────────────────────────────────────────────────────
const INIT = {
  subject: "",
  priority: "",
  department: "",
  helpTopic: "",
  mobile: "",
  room: "",
  pabx: "",
  building: "",
  attachment: null,
};

// ── UserDashboard ─────────────────────────────────────────────────────────────
const UserDashboard = () => {
  const { user } = UseAuth();
  const [dbUserData, setDbUserData] = useState(null);

  // Fetch full user record from backend when Firebase user loads
  useEffect(() => {
    if (!user?.email) return;

    // Correct endpoint format: query parameter for email search
    axiosInstance
      .get(`/api/users?email=${encodeURIComponent(user.email)}`)
      .then((res) => {
        if (res.data?.success) {
          setDbUserData(res.data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user by email:", err);
      });
  }, [user?.email]); // Debugging line to check fetched user details
  // console.log("Fetched user data from backend:", dbUserData);

  const [form, setForm] = useState(INIT);
  const [departments, setDepartments] = useState([]);
  const [helpTopics, setHelpTopics] = useState([]);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [activeFormats, setActiveFormats] = useState(new Set());

  const editorRef = useRef(null);

  // ── Fetch select options on mount ─────────────────────────────────────────
  useEffect(() => {
    axiosInstance
      .get("/api/departments")
      .then((res) => {
        const data = res.data?.data ?? [];
        setDepartments(
          data.map((d) => ({ value: d.id, label: d.department_title })),
        );
      })
      .catch((err) => console.error("Failed to load departments:", err));

    axiosInstance
      .get("/api/help-topics")
      .then((res) => {
        const data = res.data?.data ?? [];
        setHelpTopics(data.map((t) => ({ value: t.id, label: t.topic_title })));
      })
      .catch((err) => console.error("Failed to load help topics:", err));
  }, []);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const syncActiveFormats = () => {
    const updated = new Set();
    FORMAT_ACTIONS.forEach(({ id, command }) => {
      if (command === "code") return;
      try {
        if (document.queryCommandState(command)) updated.add(id);
      } catch (_) {}
    });
    setActiveFormats(updated);
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
    set("attachment", file);
  };

  const removeAttachment = () => {
    setFileError("");
    set("attachment", null);
  };

  // ── Toolbar format helpers ────────────────────────────────────────────────
  const applyFormat = (action) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (action.command === "code") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const code = document.createElement("code");
        code.style.cssText =
          "font-family:monospace;background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-size:12px;";

        if (!range.collapsed) {
          range.surroundContents(code);
          selection.removeAllRanges();
        } else {
          code.textContent = "code";
          range.insertNode(code);
          const newRange = document.createRange();
          newRange.selectNodeContents(code);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
      editor.focus();
      setActiveFormats((prev) => {
        const next = new Set(prev);
        next.has("code") ? next.delete("code") : next.add("code");
        return next;
      });
      return;
    }

    editor.focus();
    document.execCommand(action.command, false, null);
    syncActiveFormats();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const descriptionHTML = editorRef.current?.innerHTML ?? "";
    const descriptionText = editorRef.current?.innerText ?? "";

    if (!descriptionText.trim()) {
      editorRef.current?.focus();
      return;
    }

    // Map frontend form shape → backend API shape.
    // `user.dbId` is expected to be the integer user_id stored in your DB.
    // If your auth hook exposes it under a different key, adjust here.
    const resetForm = () => {
      setForm(INIT);
      setFileError("");
      setSubmitError("");
      setSubmitted(false);
      setCreatedTicket(null);
      setActiveFormats(new Set());
      if (editorRef.current) editorRef.current.innerHTML = "";
    };
    const payload = {
      user_id: dbUserData?.id,
      subject: form.subject,
      description: descriptionHTML,
      priority: form.priority.toUpperCase(), // backend expects "LOW" | "MEDIUM" etc.
      department_id: form.department, // already the integer id from the select
      help_topic_id: form.helpTopic, // same
      mobile: form.mobile,
      room: form.room || undefined,
      pabx: form.pabx || undefined,
      building_name: form.building || undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/api/tickets", payload);
      const ticket = res.data?.data ?? null;
      setCreatedTicket(ticket);
      setSubmitted(true);

      await Swal.fire({
        icon: "success",
        title: "Ticket Submitted Successfully!",
        html: ticket?.ticket_number
          ? `Your ticket <strong>${ticket.ticket_number}</strong> has been created.<br/><span class="text-xs text-slate-300 mt-2 block">📧 Confirmation email sent to your inbox and alerts dispatched to support staff.</span>`
          : "Your ticket has been created and email alerts dispatched to support staff.",
        confirmButtonText: "Got it",
        background: "#1a1a2e",
        color: "#e2e8f0",
        confirmButtonColor: "#7c3aed",
        customClass: { popup: "rounded-2xl" },
      });
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.join(", ") ||
        "Something went wrong. Please try again.";

      await Swal.fire({
        icon: "error",
        title: "Submission failed",
        text: serverMsg,
        confirmButtonText: "Try again",
        background: "#1a1a2e",
        color: "#e2e8f0",
        confirmButtonColor: "#7c3aed",
        customClass: { popup: "rounded-2xl" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
      setForm(INIT);
      setFileError("");
      setSubmitError("");
      setSubmitted(false);
      setCreatedTicket(null);
      setActiveFormats(new Set());
      if (editorRef.current) editorRef.current.innerHTML = "";
    };

  
  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d399"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-[1.25rem] font-bold text-white mb-2">
          Ticket submitted
        </h2>

        {createdTicket?.ticket_number && (
          <p className="text-[11.5px] font-mono text-violet-400/80 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1.5 mb-3">
            {createdTicket.ticket_number}
          </p>
        )}

        <p className="text-white/38 text-[13.5px] leading-relaxed mb-7">
          Your ticket has been received. Our team will get back to you shortly.
        </p>

        <button
          onClick={resetForm}
          className="px-6 py-3 rounded-xl border border-white/[0.09] bg-white/[0.05] text-white/65 text-sm font-medium hover:bg-white/[0.09] transition-colors cursor-pointer"
        >
          Submit another ticket
        </button>
      </motion.div>
    );
  }

  // ── Reset for another submission ──────────────────────────────────────────

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d399"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-[1.25rem] font-bold text-white mb-2">
          Ticket submitted
        </h2>

        {createdTicket?.ticket_number && (
          <p className="text-[11.5px] font-mono text-violet-400/80 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1.5 mb-3">
            {createdTicket.ticket_number}
          </p>
        )}

        <p className="text-white/38 text-[13.5px] leading-relaxed mb-7">
          Your ticket has been received. Our team will get back to you shortly.
        </p>

        <button
          onClick={resetForm}
          className="px-6 py-3 rounded-xl border border-white/[0.09] bg-white/[0.05] text-white/65 text-sm font-medium hover:bg-white/[0.09] transition-colors cursor-pointer"
        >
          Submit another ticket
        </button>
      </motion.div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      {/* ── Section 1: Your Details ──────────────────────────────────── */}
      <SectionCard number="1" title="Your Details">
        <div className="flex items-start gap-4">
          <img
            src={user?.photoURL ?? ""}
            alt={user?.displayName ?? "User"}
            className="w-11 h-11 rounded-full object-cover ring-1 ring-white/20 shrink-0 mt-1"
          />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Full name</FieldLabel>
              <ReadOnlyField value={user?.displayName} />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <ReadOnlyField value={user?.email} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Ticket Details ────────────────────────────────── */}
      <SectionCard number="2" title="Ticket Details">
        <div className="space-y-4">
          {/* Subject */}
          <div>
            <FieldLabel>Subject </FieldLabel>
            <input
              className={inputCls}
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Enter a brief subject line for your issue"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <FieldLabel>Priority </FieldLabel>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(({ value, color, bg }) => {
                const active = form.priority === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("priority", value)}
                    className="px-4 py-[9px] rounded-xl text-[12.5px] font-semibold border transition-all cursor-pointer select-none"
                    style={{
                      color: active ? color : "rgba(255,255,255,0.35)",
                      background: active ? bg : "transparent",
                      borderColor: active
                        ? `${color}50`
                        : "rgba(255,255,255,0.09)",
                    }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            {/* Hidden input drives native form validation for priority */}
            <input
              type="text"
              className="sr-only"
              value={form.priority}
              onChange={() => {}}
              required
              tabIndex={-1}
            />
          </div>

          {/* Department + Help Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Department </FieldLabel>
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
              <FieldLabel>Help Topic </FieldLabel>
              <select
                className={inputCls}
                name="helpTopic"
                value={form.helpTopic}
                onChange={handleChange}
                required
                style={{ colorScheme: "dark" }}
              >
                <option value="" disabled>
                  Select topic
                </option>
                {helpTopics.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile + Room + PABX */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel>Mobile </FieldLabel>
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
              <FieldLabel>Room / Building</FieldLabel>
              <input
                className={inputCls}
                name="room"
                value={form.room}
                onChange={handleChange}
                placeholder="Enter Room number"
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
                placeholder="Enter PABX"
                type="number"
                min="0"
              />
            </div>
            <div>
              <FieldLabel>Building</FieldLabel>
              <input
                className={inputCls}
                name="building"
                value={form.building}
                onChange={handleChange}
                placeholder="e.g., Library Building"
                type="number"
                min="0"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3: Description ───────────────────────────────────── */}
      <SectionCard
        number="3"
        title="Description"
        subtitle="Formatting toolbar · attachment optional up to 2 MB"
      >
        <div>
          <FieldLabel>Details </FieldLabel>

          <div className="rounded-xl border border-white/[0.09] bg-white/[0.05] focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/25 transition-colors overflow-hidden">
            {/* Rich-text area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onKeyUp={syncActiveFormats}
              onMouseUp={syncActiveFormats}
              onSelect={syncActiveFormats}
              data-placeholder="Describe your issue in detail — include error messages, steps you've tried, device/location, etc."
              className="w-full min-h-[120px] px-4 pt-3 pb-2 text-white text-[13.5px] focus:outline-none"
              style={{ "--placeholder-color": "rgba(255,255,255,0.25)" }}
            />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-2.5 py-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-0.5">
                {FORMAT_ACTIONS.map((action) => {
                  const isActive = activeFormats.has(action.id);
                  return (
                    <button
                      key={action.id}
                      type="button"
                      title={action.label}
                      aria-label={action.label}
                      onMouseDown={(e) => {
                        e.preventDefault(); // keep editor focus
                        applyFormat(action);
                      }}
                      className={toolbarBtnCls}
                      style={
                        isActive
                          ? {
                              color: "#a78bfa",
                              background: "rgba(167,139,250,0.15)",
                              borderRadius: "0.5rem",
                            }
                          : undefined
                      }
                    >
                      {action.icon}
                    </button>
                  );
                })}

                <span className="w-px h-4 bg-white/[0.08] mx-1" />

                <label
                  title="Attach a file (max 2 MB)"
                  aria-label="Attach a file"
                  className={toolbarBtnCls}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <input type="file" className="hidden" onChange={handleFile} />
                </label>
              </div>

              {form.attachment && (
                <span className="flex items-center gap-1.5 max-w-full sm:max-w-[220px] ml-auto text-[11.5px] text-white/45 bg-white/[0.05] border border-white/[0.08] rounded-lg pl-2 pr-1 py-1">
                  <span className="truncate">
                    {form.attachment.name} · {formatBytes(form.attachment.size)}
                  </span>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    title="Remove attachment"
                    aria-label="Remove attachment"
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.12] transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/40"
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          </div>

          <p
            className={`mt-1.5 text-[11.5px] ${fileError ? "text-red-400" : "text-white/25"}`}
          >
            {fileError ||
              "Rich text supported · attachment optional, up to 2 MB."}
          </p>
        </div>
      </SectionCard>

      {/* ── API error banner ─────────────────────────────────────────── */}
      {submitError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <svg
            className="shrink-0 mt-0.5"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f87171"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[12.5px] text-red-400 leading-relaxed">
            {submitError}
          </p>
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2.5 px-8 py-[14px] rounded-xl bg-white text-[#18182a] font-semibold text-[13.5px] cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed"
          whileHover={!isSubmitting ? { scale: 1.016, y: -1 } : undefined}
          whileTap={!isSubmitting ? { scale: 0.975 } : undefined}
          transition={{ type: "spring", stiffness: 440, damping: 26 }}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Submitting…
            </>
          ) : (
            <>
              Submit ticket
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default UserDashboard;
