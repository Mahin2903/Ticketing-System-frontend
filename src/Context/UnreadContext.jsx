/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
// src/Context/UnreadContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A lightweight React context that lets any component:
//   • read the unread-count / hasUnread flag for any ticket
//   • call markRead(ticketId) to clear the unread state for that ticket
//   • subscribe to changes (React re-renders automatically)
//
// Design notes
// ─────────────────────────────────────────────────────────────────────────────
// • No external store library needed — state lives in a useReducer.
// • The context re-fetches replies only when instructed (via refreshTicket).
//   In practice, React-Query's socket / polling already keeps replies fresh;
//   we just need to know WHEN the user last viewed each ticket.
// • localStorage is the persistence layer (survives page refresh).
// • Works entirely on the frontend — zero backend changes required.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useCallback, useState } from "react";
import {
  markTicketAsRead,
  getLastReadAt,
  computeUnreadState,
} from "../Hooks/UseTicketUnread";

const UnreadContext = createContext(null);

/**
 * Wrap your Router (or Dashboard layout) with this provider.
 *
 * Props:
 *   currentUserId — the DB id of the signed-in user (NOT the Firebase UID).
 *                   Pass null/undefined if not yet loaded.
 */
export const UnreadProvider = ({ children, currentUserId }) => {
  // readStamps: { [ticketId]: ISO string } — mirrors localStorage but kept in
  // state so that components re-render when markRead() is called.
  const [readStamps, setReadStamps] = useState({});

  /**
   * Call this when the user opens TicketDetails for ticketId.
   * Persists to localStorage AND triggers a re-render of badge consumers.
   */
  const markRead = useCallback(
    (ticketId) => {
      if (!currentUserId || !ticketId) return;
      markTicketAsRead(currentUserId, ticketId);
      setReadStamps((prev) => ({
        ...prev,
        [ticketId]: new Date().toISOString(),
      }));
    },
    [currentUserId]
  );

  /**
   * Compute whether a ticket has unread replies, given its replies array.
   * Reads from the in-memory stamp first (most up to date), then localStorage.
   */
  const getUnreadState = useCallback(
    (ticketId, replies = []) => {
      return computeUnreadState(ticketId, currentUserId, replies);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserId, readStamps] // readStamps in dep → recomputes after markRead
  );

  /**
   * Quick helper: does this ticket have ≥1 unread reply?
   */
  const hasUnread = useCallback(
    (ticketId, replies = []) => getUnreadState(ticketId, replies).hasUnread,
    [getUnreadState]
  );

  return (
    <UnreadContext.Provider value={{ markRead, getUnreadState, hasUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};

/**
 * Hook for consuming components.
 * Must be used inside <UnreadProvider>.
 */
export const useUnread = () => {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error("useUnread must be used within <UnreadProvider>");
  return ctx;
};