import axios from "axios";
import toast from "react-hot-toast";
import {
  isSubscriptionBlockedError,
  getSubscriptionBlockedMessage,
} from "../utils/subscriptionError";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

function getToken() {
  return localStorage.getItem("tenantToken") || localStorage.getItem("token") || "";
}

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSubscriptionBlockedError(error)) {
      toast.error(getSubscriptionBlockedMessage(error), {
        id: "subscription-blocked",
      });
    }

    if (error?.response?.status === 401) {
      localStorage.removeItem("tenantToken");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("tenantId");
      localStorage.removeItem("userId");
      sessionStorage.removeItem("storvex_me_cache_v2");
    }

    return Promise.reject(error);
  }
);

export async function apiFetch(path, options = {}) {
  const method = String(options.method || "GET").toLowerCase();

  try {
    const res = await apiClient.request({
      url: path,
      method,
      data: options.body ? JSON.parse(options.body) : undefined,
      headers: {
        ...(options.headers || {}),
      },
    });

    return res.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Request failed";

    const err = new Error(message);
    err.response = error?.response;
    err.status = error?.response?.status || null;
    err.code = error?.response?.data?.code || null;
    throw err;
  }
}

export default apiClient;