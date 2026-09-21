// src/Components/TicketFeedback/TicketFeedbackCard.jsx
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";
import { showToast, confirmDialog } from "../../lib/swal";
import {
  FEEDBACK_TYPES,
  QUICK_TAGS,
  parseFeedbackComment,
  formatFeedbackComment,
} from "../../Utilities/feedback.utils";

// ── Inner Form Component (Maintains isolated form state per feedback session) ─
const FeedbackForm = ({
  initialType = "Satisfied",
  initialTags = [],
  initialNote = "",
  isEditing = false,
  isPending = false,
  onSubmit,
  onCancel,
}) => {
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [note, setNote] = useState(initialNote);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (isPending) return;
    onSubmit({
      type: selectedType,
      noteText: note,
      tagsList: selectedTags,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-[#0e171b] to-[#0a0f14] p-6 sm:p-7 shadow-xl space-y-6 relative overflow-hidden"
    >
      {/* Glow decoration */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white tracking-tight">
              {isEditing ? "Update Your Ticket Feedback" : "Ticket Resolved — How was your experience?"}
            </h3>
            <p className="text-[12px] text-white/45 mt-0.5">
              Let the team know how your issue was handled. Your feedback helps us improve.
            </p>
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] text-white/60 hover:text-white text-[11.5px] transition-colors cursor-pointer"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        {/* Step 1: Choose Sentiment */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/45 block">
            1. Choose your resolution status <span className="text-emerald-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(FEEDBACK_TYPES).map((ft) => {
              const isSelected = selectedType === ft.id;
              return (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => setSelectedType(ft.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex items-start gap-3.5 cursor-pointer ${
                    isSelected
                      ? "shadow-lg"
                      : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.04]"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: ft.bg,
                          borderColor: ft.border,
                          boxShadow: `0 0 20px ${ft.color}15`,
                        }
                      : {}
                  }
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: isSelected ? ft.color : "rgba(255,255,255,0.06)",
                      borderColor: isSelected ? ft.border : "rgba(255,255,255,0.1)",
                      color: isSelected ? "#050b10" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {ft.id === "Satisfied" ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-[13.5px] font-bold ${isSelected ? "text-white" : "text-white/80"}`}>
                        {ft.label}
                      </span>
                      {isSelected && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${ft.color}25`, color: ft.color }}
                        >
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-white/45 leading-relaxed">{ft.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Quick Feedback Tags */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-white/45 block">
            2. Quick highlights (optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => {
              const isActive = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium border transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                      : "bg-white/[0.03] hover:bg-white/[0.07] text-white/50 hover:text-white/80 border-white/[0.06]"
                  }`}
                >
                  {isActive ? `✓ ${tag}` : `+ ${tag}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Detailed Note */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-white/45 block">
              3. Detailed note (optional)
            </label>
            <span className="text-[10.5px] text-white/30">{note.length} characters</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tell us what went well or if anything needs further attention..."
            rows={3}
            className="w-full bg-white/[0.04] border border-white/[0.09] focus:border-emerald-500/50 rounded-xl p-3.5 text-[12.5px] text-white placeholder-white/25 focus:outline-none transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving feedback…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isEditing ? "Save Updated Feedback" : "Submit Feedback"}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// ── Main Feedback Card Component ─────────────────────────────────────────────
const TicketFeedbackCard = ({
  ticket,
  currentUser,
  feedbackData = null,
  isLoadingFeedback = false,
  onReopenTicket = null,
  onFocusReply = null,
}) => {
  const axios = UseAxiosSecure();
  const queryClient = useQueryClient();

  // Normalize feedback object (can be array or single object)
  const existingFeedback = useMemo(() => {
    if (!feedbackData) return null;
    if (Array.isArray(feedbackData)) {
      return feedbackData.length > 0 ? feedbackData[0] : null;
    }
    return feedbackData.data || feedbackData;
  }, [feedbackData]);

  const parsedExisting = useMemo(() => {
    return existingFeedback ? parseFeedbackComment(existingFeedback.comment) : null;
  }, [existingFeedback]);

  const [isEditing, setIsEditing] = useState(false);

  const currentRole = (currentUser?.role || "user").toLowerCase();
  const isStaff = currentRole === "admin" || currentRole === "agent" || currentRole === "super_admin";
  const isRequester = currentUser?.id && Number(currentUser.id) === Number(ticket.user_id);
  const canSubmit = isRequester || !isStaff;

  // Submit / Update Mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ type, noteText, tagsList }) => {
      if (!currentUser?.id) throw new Error("User profile not found. Please log in again.");
      const formattedComment = formatFeedbackComment(type, noteText, tagsList);

      const res = await axios.post("/api/ticket-feedback", {
        ticket_id: parseInt(ticket.id, 10),
        user_id: parseInt(currentUser.id, 10),
        comment: formattedComment,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-feedback", ticket.id] });
      queryClient.invalidateQueries({ queryKey: ["ticket-feedback", String(ticket.id)] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
      setIsEditing(false);
      showToast(
        "success",
        data?.message || (existingFeedback ? "Feedback updated successfully!" : "Thank you! Feedback submitted.")
      );
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors.join("\n") : err.message || "Failed to submit feedback");
      showToast("error", msg);
    },
  });

  // Staff Reopen handler
  const handleStaffReopen = async () => {
    if (!onReopenTicket) return;
    const result = await confirmDialog({
      title: "Reopen Ticket?",
      html: `Move ticket <span style="color:#a78bfa;font-family:monospace">${ticket.ticket_number || `#${ticket.id}`}</span> back to <strong style="color:#60a5fa">In Progress</strong>?`,
      confirmText: "Reopen Ticket",
      confirmColor: "#60a5fa",
      icon: "question",
    });

    if (result.isConfirmed) {
      onReopenTicket();
    }
  };

  // Staff Quick Reply Handler
  const handleStaffAcknowledge = () => {
    if (onFocusReply) {
      const staffTemplate =
        parsedExisting?.type === "Satisfied"
          ? "Thank you for the kind feedback! We're glad we could get this resolved quickly for you."
          : "Thank you for confirming completion! Please reach out if you need anything else.";
      onFocusReply(staffTemplate);
    }
  };

  if (isLoadingFeedback) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0c1d] p-6 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-white/[0.06] rounded-lg" />
        <div className="h-20 bg-white/[0.03] rounded-xl" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // View 1: Requester / User Form when submitting or editing
  // ─────────────────────────────────────────────────────────────────────────────
  if (canSubmit && (!existingFeedback || isEditing)) {
    return (
      <FeedbackForm
        key={existingFeedback ? `edit-${existingFeedback.id}` : "new"}
        initialType={parsedExisting?.type || "Satisfied"}
        initialTags={parsedExisting?.tags || []}
        initialNote={parsedExisting?.note || ""}
        isEditing={!!existingFeedback}
        isPending={submitFeedbackMutation.isPending}
        onSubmit={(payload) => submitFeedbackMutation.mutate(payload)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // View 2: Feedback Display (For Requester review or Staff Inspection)
  // ─────────────────────────────────────────────────────────────────────────────
  if (existingFeedback) {
    const activeConfig = FEEDBACK_TYPES[parsedExisting?.type] || FEEDBACK_TYPES.Satisfied;
    const authorName = existingFeedback.user_name || (isRequester ? "You" : "Requester");

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.08] bg-[#0d0c1d] p-6 sm:p-7 shadow-xl space-y-5 relative overflow-hidden"
      >
        {/* Glow indicator based on sentiment */}
        <div
          className="absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full pointer-events-none"
          style={{ backgroundColor: `${activeConfig.color}15` }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border"
              style={{
                backgroundColor: activeConfig.bg,
                borderColor: activeConfig.border,
                color: activeConfig.color,
              }}
            >
              {activeConfig.id === "Satisfied" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-white">
                  {isStaff ? "Requester Feedback" : "Your Feedback"}
                </h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5"
                  style={{
                    backgroundColor: activeConfig.bg,
                    borderColor: activeConfig.border,
                    color: activeConfig.color,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeConfig.color }} />
                  {activeConfig.label}
                </span>
              </div>
              <p className="text-[11.5px] text-white/35 mt-0.5">
                Submitted by <strong className="text-white/70 font-semibold">{authorName}</strong>
                {existingFeedback.created_at && ` · ${new Date(existingFeedback.created_at).toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {canSubmit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white text-[11.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Feedback
              </button>
            )}
          </div>
        </div>

        {/* Feedback Body */}
        <div className="space-y-3">
          {parsedExisting?.tags && parsedExisting.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {parsedExisting.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-white/70"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          )}

          {parsedExisting?.note ? (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[13px] text-white/80 italic leading-relaxed whitespace-pre-wrap">
              "{parsedExisting.note}"
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white/[0.015] border border-white/[0.04] text-[12px] text-white/40 italic">
              Requester confirmed resolution without additional notes.
            </div>
          )}
        </div>

        {/* Staff Action Bar: Taking action on feedback */}
        {isStaff && (
          <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11.5px] text-white/40">
              Actions available for staff:
            </div>
            <div className="flex items-center gap-2">
              {onFocusReply && (
                <button
                  type="button"
                  onClick={handleStaffAcknowledge}
                  className="px-3.5 py-1.5 rounded-xl border border-violet-500/30 bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Reply to Feedback
                </button>
              )}

              {onReopenTicket && (
                <button
                  type="button"
                  onClick={handleStaffReopen}
                  className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Reopen Ticket
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // View 3: For Staff when no feedback has been submitted yet
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0c1d] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white/40">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/30 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white/70">Awaiting Requester Feedback</p>
          <p className="text-[11.5px] text-white/35 mt-0.5">
            The ticket is marked complete. The user has been invited via email to submit feedback.
          </p>
        </div>
      </div>

      {onReopenTicket && (
        <button
          type="button"
          onClick={handleStaffReopen}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white text-[11.5px] font-medium transition-colors cursor-pointer"
        >
          Reopen if Needed
        </button>
      )}
    </div>
  );
};

export default TicketFeedbackCard;
