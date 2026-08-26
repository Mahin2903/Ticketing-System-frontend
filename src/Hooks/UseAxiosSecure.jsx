// src/Hooks/UseAxiosSecure.jsx

import axios from "axios";

// Create once at module level — not inside the hook
const axiosInstance = axios.create({
  baseURL: "http://localhost:8000",
});

const UseAxiosSecure = () => {
  return axiosInstance; // return the instance, not an object wrapping it
};

export default UseAxiosSecure;
