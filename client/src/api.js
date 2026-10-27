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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");
    if (error.response?.status === 401 && !isAuthCall && localStorage.getItem("flexi_token")) {
      localStorage.removeItem("flexi_token");
      localStorage.removeItem("flexi_user");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") return "The server took too long to respond.";
  if (!error.response) return "Can't reach the backend. Make sure the server and MongoDB are running.";
  return error.response.data?.message || "Something went wrong. Please try again.";
}

export default api;
