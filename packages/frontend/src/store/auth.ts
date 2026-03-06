import { create } from 'zustand';
import { authApi } from '../api';

interface User {
  id: number;
  username: string;
  displayName: string;
}

interface Member {
  id: number;
  displayName: string;
  wowClass: string;
  wowClassZh: string;
  isLeader: boolean;
  status: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  member: Member | null;
  isLoading: boolean;
  isLeader: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  member: null,
  isLoading: false,
  isLeader: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login({ username, password });
      localStorage.setItem('token', data.token);
      set({
        token: data.token,
        user: data.user,
        member: data.member,
        isLeader: data.member?.isLeader || false,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (username, password, displayName) => {
    set({ isLoading: true });
    try {
      const data = await authApi.register({ username, password, displayName });
      localStorage.setItem('token', data.token);
      set({
        token: data.token,
        user: data.user,
        member: null,
        isLeader: false,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, member: null, isLeader: false });
  },

  loadFromStorage: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ isLoading: true });
    try {
      const data = await authApi.me();
      set({
        token,
        user: data.user,
        member: data.member,
        isLeader: data.member?.isLeader || false,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null, member: null, isLeader: false, isLoading: false });
    }
  },
}));
