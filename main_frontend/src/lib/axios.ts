import axios from "axios";

// Automatically use VITE_API_URL environment variable if set
// Fallback to /api for relative paths (Render deployment where frontend is served by backend)
export const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
    baseURL,
    withCredentials: true,
});

// Add a request interceptor to attach the token if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("voxwave_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
