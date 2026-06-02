import { create } from 'zustand';
import axios from 'axios';

const BASE_URL = 'http://localhost:5076';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('vlxd_admin_user')) || null,
  token: localStorage.getItem('vlxd_admin_token') || null,
  isAuthenticated: !!localStorage.getItem('vlxd_admin_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
      const { token, email: userEmail, fullName, roles, customerTier } = response.data;
      
      const user = {
        email: userEmail,
        fullName,
        role: roles && roles.length > 0 ? roles[0] : null,
        roles,
        customerTier
      };

      // Restrict admin portal to Admin and Employee roles
      if (user.role !== 'Admin' && user.role !== 'Employee') {
        const errorMsg = 'Access Denied: Admin or Employee privileges required.';
        set({ error: errorMsg, loading: false });
        return { success: false, error: errorMsg };
      }
      
      localStorage.setItem('vlxd_admin_token', token);
      localStorage.setItem('vlxd_admin_user', JSON.stringify(user));
      
      set({ token, user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('vlxd_admin_token');
    localStorage.removeItem('vlxd_admin_user');
    set({ token: null, user: null, isAuthenticated: false, error: null });
  }
}));
