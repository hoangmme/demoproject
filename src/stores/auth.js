import { defineStore } from 'pinia';
import { login as apiLogin } from '@/api/users';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isLoggedIn: false,
  }),
  getters: {
    isAdmin: (state) => {
      if (!state.user) return false;
      const email = state.user.email || '';
      const role = typeof state.user.role === 'object' ? (state.user.role?.name || '') : String(state.user.role || '');
      return email === 'admin@demo.com' || role.toLowerCase().includes('admin');
    },
    userDisplayName: (state) => {
      if (!state.user) return '';
      return state.user.first_name || state.user.name || state.user.email || 'Người dùng';
    },
  },
  actions: {
    initAuth() {
      try {
        const session = localStorage.getItem('mvp_session');
        if (session) {
          this.user = JSON.parse(session);
          this.isLoggedIn = true;
        }
      } catch (e) {
        this.user = null;
        this.isLoggedIn = false;
      }
    },
    async login(email, password) {
      const userData = await apiLogin(email, password);
      this.user = userData;
      this.isLoggedIn = true;
      localStorage.setItem('mvp_session', JSON.stringify(userData));
      return userData;
    },
    logout() {
      this.user = null;
      this.isLoggedIn = false;
      localStorage.removeItem('mvp_session');
    },
    canReadColumn(colId) {
      if (this.isAdmin) return true;
      if (!this.user?.column_permissions) return true;
      try {
        const perms = typeof this.user.column_permissions === 'string'
          ? JSON.parse(this.user.column_permissions)
          : this.user.column_permissions;
        if (perms[colId] && perms[colId].read === false) return false;
      } catch (e) {}
      return true;
    },
    canWriteColumn(colId) {
      if (this.isAdmin) return true;
      if (!this.user?.column_permissions) return true;
      try {
        const perms = typeof this.user.column_permissions === 'string'
          ? JSON.parse(this.user.column_permissions)
          : this.user.column_permissions;
        if (perms[colId] && perms[colId].write === false) return false;
      } catch (e) {}
      return true;
    },
  },
});
