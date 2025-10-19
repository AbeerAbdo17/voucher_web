// frontend/src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // أضفنا /api هنا
});

// 🔹 إضافة التوكن تلقائياً لكل الطلبات
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
