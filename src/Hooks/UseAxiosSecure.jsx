import axios from "axios";
// import React from "react";






const { AxiosInstance } = axios.create({
  baseURL: "hhttp://localhost:5173",
});
const UseAxiosSecure = () => {
  return { AxiosInstance };
};

export default UseAxiosSecure;
