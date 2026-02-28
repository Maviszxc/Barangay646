/** @format */

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // Replace with your API base URL
  headers: {
    "Content-Type": "application/json",
  },
  
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("userToken") || localStorage.getItem("adminToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("adminToken");
    return Promise.reject(error);
  }
);

export default axiosInstance;
