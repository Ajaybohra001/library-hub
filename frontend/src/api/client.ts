import axios from "axios";

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      if (window.location.pathname !== "/login")
        window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    if (error.response?.status === 403)
      return "You are not allowed to perform this action.";
    if (error.response?.status === 404)
      return "The requested resource was not found.";
    if (error.response?.status === 409)
      return "This action conflicts with the current library state.";
  }
  return "Something went wrong. Please try again.";
}
