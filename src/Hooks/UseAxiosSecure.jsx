// src/Hooks/UseAxiosSecure.jsx

import axios from "axios";
import { getAuth } from "firebase/auth";
import app from "../Components/Authentication/Firebase/firebase.init";

const auth = getAuth(app);

// Create once at module level — not inside the hook
// eslint-disable-next-line react-refresh/only-export-components
export const axiosInstance = axios.create({
  baseURL: "http://localhost:8000",
});

/**
 * Request interceptor:
 * Automatically gets the verified Firebase ID Token (JWT) from auth.currentUser
 * and sends it via 'Authorization: Bearer <token>' header on all outgoing API calls.
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Failed to retrieve Firebase ID token for request:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * If an authenticated request encounters a 401, force-refresh the Firebase ID Token
 * via auth.currentUser.getIdToken(true) to ensure custom claim updates or refreshed tokens
 * are seamlessly retried.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      auth.currentUser
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await auth.currentUser.getIdToken(true);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        console.error("Failed to refresh Firebase ID token on 401:", refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

const UseAxiosSecure = () => {
  return axiosInstance;
};

export default UseAxiosSecure;