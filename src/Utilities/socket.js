// src/Utilities/socket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

let socket = null;

/**
 * Returns the singleton Socket.IO client instance.
 * Initializes the connection if it doesn't already exist.
 *
 * @param {Object} auth - Optional auth parameters (userId, role, ticketId).
 * @returns {Socket}
 */
export const getSocket = (auth = {}) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      auth,
    });

    socket.on("connect", () => {
      console.log("⚡ [Socket.IO] Connected to server:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ [Socket.IO] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 [Socket.IO] Disconnected:", reason);
    });
  } else if (Object.keys(auth).length > 0) {
    // Update auth parameters dynamically if provided
    socket.auth = { ...socket.auth, ...auth };
  }

  return socket;
};

/**
 * Explicitly disconnects and resets the socket instance.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
