import { create } from 'zustand';
import type { UserInfo } from '../types/userType';

interface AuthState {
  accessToken: string | null;
  user: UserInfo | null;
  setAuth: (accessToken: string | null, user: UserInfo | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));

