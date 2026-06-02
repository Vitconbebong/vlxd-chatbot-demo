import { create } from "zustand";
import axios from "axios";

// #region Helper Methods

// Safely parse user data from localStorage to prevent JSON parsing errors
const getSafeUserFromStorage = () => {
  try {
    const storedUser = localStorage.getItem("vlxd_user");
    if (!storedUser || storedUser === "undefined" || storedUser === "null") {
      return null;
    }
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

// Safely retrieve token from localStorage
const getSafeTokenFromStorage = () => {
  const token = localStorage.getItem("vlxd_token");
  if (!token || token === "undefined" || token === "null") {
    return null;
  }
  return token;
};

// #endregion

const BASE_URL = "http://localhost:5076";

// #region Store Definition

export const useAuthStore = create((set) => ({
  // Initial state setup using safe storage getters
  user: getSafeUserFromStorage(),
  token: getSafeTokenFromStorage(),
  isAuthenticated: !!getSafeTokenFromStorage(),
  loading: false,
  error: null,

  // Authenticate user and store session
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      const { token, email: userEmail, fullName, roles, customerTier } = response.data;

      const user = {
        email: userEmail,
        fullName,
        role: roles && roles.length > 0 ? roles[0] : null,
        roles,
        customerTier
      };

      localStorage.setItem("vlxd_token", token);
      localStorage.setItem("vlxd_user", JSON.stringify(user));

      set({ token, user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Login failed. Please check credentials.";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  // Register a new customer account
  register: async (fullName, email, phone, address, password) => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        fullName,
        email,
        phone,
        address,
        password,
      });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Registration failed. Try again.";
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  // Clear session and reset state
  logout: () => {
    localStorage.removeItem("vlxd_token");
    localStorage.removeItem("vlxd_user");
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },
}));

// #endregion
