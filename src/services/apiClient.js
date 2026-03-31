import axios from "axios";
import {
  isSubscriptionBlockedError,
  toastSubscriptionBlockedError,
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
      toastSubscriptionBlockedError(error, {
        toastId: "subscription-blocked",
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

function buildRequestConfig(path, options = {}) {
  const config = {
    url: path,
    method: String(options.method || "GET").toLowerCase(),
    headers: {
      ...(options.headers || {}),
    },
    params: options.query ? { ...options.query } : undefined,
  };

  if (options.body !== undefined && options.body !== null) {
    if (typeof options.body === "string") {
      try {
        config.data = JSON.parse(options.body);
      } catch {
        config.data = options.body;
      }
    } else {
      config.data = options.body;
    }
  }

  if (options.responseType) {
    config.responseType = options.responseType;
  }

  if (options.signal) {
    config.signal = options.signal;
  }

  return config;
}

export async function apiFetch(path, options = {}) {
  try {
    const res = await apiClient.request(buildRequestConfig(path, options));
    return res.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Request failed";

    const err = new Error(message);
    err.response = error?.response;
    err.status = error?.response?.status;
    err.code =
      error?.response?.data?.code ||
      error?.code ||
      null;
    err.data = error?.response?.data || null;

    throw err;
  }
}

export default apiClient;