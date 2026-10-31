import { get } from "lodash";
import { create } from "zustand";
import api from "../config/auth/api";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set, getState) => ({
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem("accessToken"),

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  },

  fetchAdminProfile: async () => {
    try {
      const response = await api.get("/admin/auth/me");
      const data = response.data;
      const profile = data?.content || data;
      if (profile && (profile.id || profile.role || profile.username)) {
        set({ user: profile });
        localStorage.setItem("user", JSON.stringify(profile));
        return profile;
      }
    } catch (error) {
      console.warn("Failed to fetch admin profile:", error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        getState().logout();
      }
    }
    return null;
  },

  login: async (credentials) => {
    try {
      const response = await api.post("/admin/auth/login", credentials);
      const data = response.data;
      const accessToken =
        data?.accessToken ||
        data?.access_token ||
        data?.content?.accessToken ||
        data?.content?.access_token ||
        data?.data?.accessToken ||
        data?.data?.access_token;
      const refreshToken =
        data?.refreshToken ||
        data?.refresh_token ||
        data?.content?.refreshToken ||
        data?.content?.refresh_token ||
        data?.data?.refreshToken ||
        data?.data?.refresh_token;
      const user = data?.user || data?.content?.user || data?.data?.user;

      set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: !!accessToken,
      });

      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      window.location.href = "/";
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post("/admin/auth/logout");
    } catch (e) {
      console.warn("Logout notification failed:", e);
    }

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    window.location.href = "/auth/login";
  },

  refreshAccessToken: async () => {
    try {
      const state = getState(); // useAuthStore.getState() ni to‘g‘ri ishlatish
      if (!state.refreshToken) {
        console.log("No refresh token found, logging out...");
        state.logout();
        return;
      }

      const response = await api.post("/auth/refresh-token", {
        refreshToken: state.refreshToken,
      });

      const data = response.data;
      const newAccessToken =
        data?.accessToken ||
        data?.access_token ||
        data?.content?.accessToken ||
        data?.content?.access_token ||
        data?.data?.accessToken ||
        data?.data?.access_token;
      if (!newAccessToken) {
        console.log("Failed to retrieve new access token, logging out...");
        state.logout();
        return;
      }

      set({ accessToken: newAccessToken });
      localStorage.setItem("accessToken", newAccessToken);
      console.log("Access token refreshed");
    } catch (error) {
      console.error("Failed to refresh access token", error);
      if (error.response?.status === 401) {
        getState().logout();
      }
    }
  },
}));

export default useAuthStore;
