/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
// src/Hooks/UseTicketUnread.js
// ─────────────────────────────────────────────────────────────────────────────
// Tracks "unread" replies per ticket, per user, using localStorage.
//
// Storage key pattern:
//   ticket_read:{userId}:{ticketId}  →  ISO timestamp (last time user viewed)
//
// A reply is "unread" if its created_at is AFTER the stored last-read
// timestamp AND it was NOT sent by the current user.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "ticket_read";

/** Build the localStorage key for a (user, ticket) pair. */
export const buildReadKey = (userId, ticketId) =>
  `${STORAGE_PREFIX}:${userId}:${ticketId}`;

/**
 * Record that `userId` has just read ticket `ticketId`.
 * Stores the current ISO timestamp.
 */
export const markTicketAsRead = (userId, ticketId) => {
  if (!userId || !ticketId) return;
  try {
    localStorage.setItem(buildReadKey(userId, ticketId), new Date().toISOString());
  } catch (_) {}
};

/**
 * Return the ISO timestamp when `userId` last read `ticketId`, or null.
 */
export const getLastReadAt = (userId, ticketId) => {
  if (!userId || !ticketId) return null;
  try {
    return localStorage.getItem(buildReadKey(userId, ticketId)) ?? null;
  } catch (_) {
    return null;
  }
};

/**
 * Given a ticket's reply array, decide whether there are unread replies
 * for `currentUserId`.
 *
 * @param {number|string} ticketId
 * @param {number|string} currentUserId
 * @param {Array}  replies  — array of reply objects with { id, user_id, created_at }
 * @returns {{ hasUnread: boolean, unreadCount: number, latestUnreadAt: string|null }}
 */
export const computeUnreadState = (ticketId, currentUserId, replies = []) => {
  const lastReadAt = getLastReadAt(currentUserId, ticketId);

  const unread = replies.filter((r) => {
    // Don't count own messages as unread
    if (String(r.user_id) === String(currentUserId)) return false;
    // If never read, everything is unread
    if (!lastReadAt) return true;
    return new Date(r.created_at) > new Date(lastReadAt);
  });

  return {
    hasUnread: unread.length > 0,
    unreadCount: unread.length,
    latestUnreadAt:
      unread.length > 0 ? unread[unread.length - 1].created_at : null,
  };
};

/**
 * Given a list of tickets, their replies map, and the current user,
 * returns a Map<ticketId, { hasUnread, unreadCount, latestUnreadAt }>.
 *
 * @param {Array}  tickets
 * @param {Object} repliesMap   — { [ticketId]: reply[] }
 * @param {number|string} currentUserId
 */
export const buildUnreadMap = (tickets = [], repliesMap = {}, currentUserId) => {
  const map = new Map();
  for (const ticket of tickets) {
    const replies = repliesMap[ticket.id] ?? [];
    map.set(ticket.id, computeUnreadState(ticket.id, currentUserId, replies));
  }
  return map;
};