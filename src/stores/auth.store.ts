import { create } from 'zustand';
import { token } from '../lib/token';
import type { AuthUser, JwtPayload } from '../types/auth.types';

function decodeJwt(jwt: string): JwtPayload | null {
  try {
    const payload = jwt.split('.')[1];
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setTokens: (access, refresh) => {
    token.set(access, refresh);
    const payload = decodeJwt(access);
    set({
      accessToken: access,
      isAuthenticated: true,
      user: payload
        ? {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            isProfileComplete: payload.isProfileComplete,
          }
        : null,
    });
  },

  updateUser: (patch) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...patch } : null,
    }));
  },

  logout: () => {
    token.clear();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hydrate: () => {
    const access = token.getAccess();
    if (!access) return;
    const payload = decodeJwt(access);
    if (!payload || payload.exp * 1000 < Date.now()) {
      token.clear();
      return;
    }
    set({
      accessToken: access,
      isAuthenticated: true,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        isProfileComplete: payload.isProfileComplete,
      },
    });
  },
}));
