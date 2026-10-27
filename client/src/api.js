import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("flexi_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") return "The server took too long to respond.";
  if (!error.response) return "Can't reach the backend. Make sure the server and MongoDB are running.";
  return error.response.data?.message || "Something went wrong. Please try again.";
}

export default api;
