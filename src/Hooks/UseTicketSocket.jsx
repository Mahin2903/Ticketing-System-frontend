// src/Hooks/UseTicketSocket.jsx
import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../Utilities/socket";

/**
 * Custom hook to manage Socket.IO connection and room subscriptions for a specific ticket.
 *
 * @param {string|number} ticketId - Current ticket ID
 * @param {Object} currentUser - Logged in user profile { id, role, email, name }
 * @param {Function} [onNewReply] - Optional callback when a new reply arrives
 */
const UseTicketSocket = (ticketId, currentUser = null, onNewReply = null) => {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const callbackRef = useRef(onNewReply);

  // Keep callback reference fresh
  useEffect(() => {
    callbackRef.current = onNewReply;
  }, [onNewReply]);

  useEffect(() => {
    if (!ticketId) return;

    const auth = {};
    if (currentUser?.id) auth.userId = currentUser.id;
    if (currentUser?.role) auth.role = currentUser.role;
    auth.ticketId = ticketId;

    const socket = getSocket(auth);

    // Track connection state
    setIsConnected(socket.connected);

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join_ticket", ticketId);
      if (currentUser?.id) {
        socket.emit("join_user", currentUser.id);
      }
      if (currentUser?.role) {
        socket.emit("join_role", currentUser.role);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // If already connected, join immediately
    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Incoming reply handler
    const handleIncomingReply = (payload) => {
      const reply = payload?.reply || payload;
      if (!reply || !reply.id) return;

      // Update React Query cache for ticket-replies
      const updateCache = (key) => {
        queryClient.setQueryData(key, (oldData) => {
          if (!oldData) return [reply];

          // Handle both array response and { data: [...] } structure
          const isWrapped = !Array.isArray(oldData) && Array.isArray(oldData?.data);
          const currentList = isWrapped ? oldData.data : Array.isArray(oldData) ? oldData : [];

          // Prevent duplicates
          if (currentList.some((r) => r.id === reply.id)) {
            return oldData;
          }

          const updatedList = [...currentList, reply];
          return isWrapped ? { ...oldData, data: updatedList } : updatedList;
        });
      };

      updateCache(["ticket-replies", ticketId]);
      updateCache(["ticket-replies", String(ticketId)]);

      if (callbackRef.current) {
        callbackRef.current(reply);
      }
    };

    socket.on("ticket:reply", handleIncomingReply);
    socket.on("new_ticket_reply", handleIncomingReply);

    return () => {
      socket.emit("leave_ticket", ticketId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("ticket:reply", handleIncomingReply);
      socket.off("new_ticket_reply", handleIncomingReply);
    };
  }, [ticketId, currentUser?.id, currentUser?.role, queryClient]);

  return {
    isConnected,
    socket: getSocket(),
  };
};

export default UseTicketSocket;
