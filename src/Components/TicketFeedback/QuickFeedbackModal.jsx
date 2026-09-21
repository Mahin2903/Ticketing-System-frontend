// src/Components/TicketFeedback/QuickFeedbackModal.jsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";
import TicketFeedbackCard from "./TicketFeedbackCard";

const QuickFeedbackModal = ({
  isOpen,
  onClose,
  ticket,
  currentUser,
  onSuccess,
}) => {
  const axios = UseAxiosSecure();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch feedback for this ticket
  const { data: feedbackData, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ["ticket-feedback", ticket?.id],
    queryFn: async () => {
      if (!ticket?.id) return null;
      const res = await axios.get(`/api/ticket-feedback/ticket/${ticket.id}`);
      return res.data?.data || res.data || [];
    },
    enabled: isOpen && !!ticket?.id,
  });

  if (!isOpen || !ticket) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#090814] border border-white/[0.1] rounded-3xl shadow-2xl p-6 sm:p-7 overflow-y-auto max-h-[90vh] z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] text-white/40 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.06]">
                  {ticket.ticket_number || `TKT-${ticket.id}`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                  COMPLETED
                </span>
              </div>
              <h2 className="text-[16px] font-bold text-white truncate">{ticket.subject}</h2>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white flex items-center justify-center transition-colors shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Feedback Card Body */}
          <TicketFeedbackCard
            ticket={ticket}
            currentUser={currentUser}
            feedbackData={feedbackData}
            isLoadingFeedback={isLoadingFeedback}
            onFeedbackSubmitted={() => {
              if (onSuccess) onSuccess();
            }}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickFeedbackModal;
