/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
// src/Pages/Dashboards/UserDashboard.jsx

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import UseAuth from "../../Hooks/UseAuth";

// ── Static option lists ───────────────────────────────────────────────────────
const PRIORITIES = [
  { value: "Low",      color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  { value: "Medium",   color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  { value: "High",     color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  { value: "Critical", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Electronics & Telecommunication Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Environmental Science",
  "Business Administration",
  "English",
  "Administration Office",
  "Library",
  "IT & Network Services",
  "Examination Office",
  "Finance & Accounts",
];

const HELP_TOPICS = [
  "Network & Internet Access",
  "Computer Hardware",
  "Software Installation / Issue",
  "Account & Login Problem",
  "Email & Communication",
  "Printing & Scanning",
  "CCTV & Surveillance",
  "Phone & PABX",
  "Data Backup & Recovery",
  "Website & Portal",
  "Other",
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
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "bullet",
    label: "Bullet list",
    command: "insertUnorderedList",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <line x1="9" y1="6" x2="20" y2="6" />
        <line x1="9" y1="12" x2="20" y2="12" />
        <line x1="9" y1="18" x2="20" y2="18" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
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
        {subtitle && <p className="text-[11.5px] text-white/35 mt-0.5">{subtitle}</p>}
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
  <div className={`${inputCls} bg-white/[0.02] text-white/45 cursor-default select-none`}>
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
  attachment: null,
};

// ── UserDashboard ─────────────────────────────────────────────────────────────
const UserDashboard = () => {
  const { user } = UseAuth();
  const [form, setForm] = useState(INIT);
  const [fileError, setFileError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeFormats, setActiveFormats] = useState(new Set());
  const editorRef = useRef(null);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  // Keep active formats in sync with actual selection state (e.g. when user
  // moves cursor into non-bold text, bold button should deactivate)
  const syncActiveFormats = () => {
    const updated = new Set();
    FORMAT_ACTIONS.forEach(({ id, command }) => {
      if (command === "code") return; // execCommand has no queryState for code
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
      setFileError(`"${file.name}" is ${formatBytes(file.size)} — max is 2 MB.`);
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

  // Apply a toolbar format command
  const applyFormat = (action) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (action.command === "code") {
      // Wrap selection in <code> tag manually
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const code = document.createElement("code");
          code.style.cssText =
            "font-family:monospace;background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-size:12px;";
          range.surroundContents(code);
          selection.removeAllRanges();
        } else {
          // No selection: insert a <code> placeholder
          const code = document.createElement("code");
          code.style.cssText =
            "font-family:monospace;background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-size:12px;";
          code.textContent = "code";
          range.insertNode(code);
          // Select the placeholder text
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

    // Standard execCommand (bold / italic / underline / insertUnorderedList)
    editor.focus();
    document.execCommand(action.command, false, null);
    syncActiveFormats();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const descriptionHTML = editorRef.current?.innerHTML ?? "";
    const descriptionText = editorRef.current?.innerText ?? "";

    if (!descriptionText.trim()) {
      editorRef.current?.focus();
      return;
    }

    const payload = {
      ticketId: `TKT-${Date.now()}`,
      subject:     form.subject,
      priority:    form.priority,
      department:  form.department,
      helpTopic:   form.helpTopic,
      mobile:      form.mobile,
      room:        form.room,
      pabx:        form.pabx,
      description: descriptionHTML,   // rich HTML
      descriptionPlain: descriptionText,
      attachment:  form.attachment
        ? { name: form.attachment.name, size: form.attachment.size, type: form.attachment.type }
        : null,
      submittedBy: {
        uid:      user?.uid,
        name:     user?.displayName,
        email:    user?.email,
        photoURL: user?.photoURL,
      },
      submittedAt: new Date().toISOString(),
    };

    console.log("Ticket submitted:", payload);
    setSubmitted(true);
  };

  // Reset editor content when going back to submit another ticket
  const resetForm = () => {
    setForm(INIT);
    setFileError("");
    setSubmitted(false);
    setActiveFormats(new Set());
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-[1.25rem] font-bold text-white mb-2">Ticket submitted</h2>
        <p className="text-white/38 text-[13.5px] leading-relaxed mb-7">
          The payload has been logged to the console. You can connect the API later.
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

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">

      {/* ── Section 1: Your Details ────────────────────────────────────── */}
      <SectionCard
        number="1"
        title="Your Details"
        // subtitle="Pre-filled from your account — read only"
      >
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

      {/* ── Section 2: Ticket Details ──────────────────────────────────── */}
      <SectionCard
        number="2"
        title="Ticket Details"
        // subtitle="Subject · Priority · Dept · Help Topic · Mobile · Room · PABX"
      >
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
            <FieldLabel>Priority *</FieldLabel>
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
                      borderColor: active ? `${color}50` : "rgba(255,255,255,0.09)",
                    }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
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
              <FieldLabel>Department *</FieldLabel>
              <select
                className={inputCls}
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                style={{ colorScheme: "dark" }}
              >
                <option value="" disabled>Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Help Topic *</FieldLabel>
              <select
                className={inputCls}
                name="helpTopic"
                value={form.helpTopic}
                onChange={handleChange}
                required
                style={{ colorScheme: "dark" }}
              >
                <option value="" disabled>Select topic</option>
                {HELP_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Mobile + Room + PABX */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel>Mobile</FieldLabel>
              <input
                className={inputCls}
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="017XXXXXXXX"
                type="tel"
              />
            </div>
            <div>
              <FieldLabel>Room / Building</FieldLabel>
              <input
                className={inputCls}
                name="room"
                value={form.room}
                onChange={handleChange}
                placeholder="e.g. CSE-301"
              />
            </div>
            <div>
              <FieldLabel>PABX Extension</FieldLabel>
              <input
                className={inputCls}
                name="pabx"
                value={form.pabx}
                onChange={handleChange}
                placeholder="e.g. 2240"
                type="number"
                min="0"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3: Description ─────────────────────────────────────── */}
      <SectionCard
        number="3"
        title="Description"
        subtitle="Formatting toolbar and one attachment up to 2 MB"
      >
        <div>
          <FieldLabel>Details *</FieldLabel>

          <div className="rounded-xl border border-white/[0.09] bg-white/[0.05] focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/25 transition-colors overflow-hidden">

            {/* ── contentEditable rich-text area ── */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onKeyUp={syncActiveFormats}
              onMouseUp={syncActiveFormats}
              onSelect={syncActiveFormats}
              data-placeholder="Describe your issue in detail — include error messages, steps you've tried, device/location, etc."
              className="w-full min-h-[120px] px-4 pt-3 pb-2 text-white text-[13.5px] focus:outline-none"
              style={{
                // Show placeholder via CSS when empty
                "--placeholder-color": "rgba(255,255,255,0.25)",
              }}
            />

            {/* Toolbar row */}
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
                        // Prevent the editor from losing focus when clicking toolbar
                        e.preventDefault();
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
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
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </span>
              )}
            </div>
          </div>

          <p className={`mt-1.5 text-[11.5px] ${fileError ? "text-red-400" : "text-white/25"}`}>
            {fileError || "Rich text supported · attachment optional, up to 2 MB."}
          </p>
        </div>
      </SectionCard>

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <motion.button
          type="submit"
          className="flex items-center gap-2.5 px-8 py-[14px] rounded-xl bg-white text-[#18182a] font-semibold text-[13.5px] cursor-pointer select-none"
          whileHover={{ scale: 1.016, y: -1 }}
          whileTap={{ scale: 0.975 }}
          transition={{ type: "spring", stiffness: 440, damping: 26 }}
        >
          Submit ticket
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
          </svg>
        </motion.button>
      </div>

    </form>
  );
};

export default UserDashboard;