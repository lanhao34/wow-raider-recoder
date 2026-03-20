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
  tags: string[];
  status: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  member: Member | null; // 当前选中的角色（第一个）
  members: Member[] | null; // 所有角色
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  member: null,
  members: [],
  isLoading: !!localStorage.getItem('token'),
  isAdmin: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login({ username, password });
      localStorage.setItem('token', data.token);
      set({
        token: data.token,
        user: data.user,
        member: data.member,
        members: data.members || [],
        isAdmin: data.isAdmin || false,
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
        member: data.member,
        members: [],
        isAdmin: false,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, member: null, members: [], isAdmin: false });
  },

  loadFromStorage: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const data = await authApi.me();
      const membersList = data.members || [];
      set({
        token,
        user: data.user,
        member: membersList[0] || null,
        members: membersList,
        isAdmin: data.isAdmin || false,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null, member: null, members: [], isAdmin: false, isLoading: false });
    }
  },
}));
