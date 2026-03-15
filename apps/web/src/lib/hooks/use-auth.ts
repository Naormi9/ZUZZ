import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, ApiError } from '@/lib/api';
import { isCapacitorNative } from '@/lib/mobile/capacitor';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[];
  profile?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // OTP flow
  requestOtp: (email: string) => Promise<void>;
  register: (name: string, email: string, phone?: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  devLogin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;

  // Internal
  setAuth: (token: string, user: User) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      requestOtp: async (email: string) => {
        set({ isLoading: true });
        try {
          await api.post('/api/auth/login', { email });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name: string, email: string, phone?: string) => {
        set({ isLoading: true });
        try {
          await api.post('/api/auth/register', { email, name, phone });
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (email: string, code: string) => {
        set({ isLoading: true });
        try {
          const res = await api.post<{ success: boolean; data: { token: string; user: User } }>(
            '/api/auth/verify',
            { email, code },
          );
          const { token, user } = res.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      devLogin: async (email: string) => {
        set({ isLoading: true });
        try {
          const res = await api.post<{ success: boolean; data: { token: string; user: any } }>(
            '/api/auth/dev-login',
            { email },
          );
          const { token, user } = res.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/api/auth/logout');
        } catch {
          // ignore logout errors
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      refreshMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await api.get<{ success: boolean; data: User }>('/api/auth/me');
          set({ user: res.data, isAuthenticated: true });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            set({ user: null, token: null, isAuthenticated: false });
          }
        }
      },

      setAuth: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
      },
    }),
    {
      name: 'zuzz-auth',
      storage: createJSONStorage(() => {
        // On native, use Capacitor Preferences (async storage adapter)
        if (typeof window !== 'undefined' && isCapacitorNative()) {
          return {
            getItem: async (name: string): Promise<string | null> => {
              const { Preferences } = await import('@capacitor/preferences');
              const { value } = await Preferences.get({ key: name });
              return value;
            },
            setItem: async (name: string, value: string): Promise<void> => {
              const { Preferences } = await import('@capacitor/preferences');
              await Preferences.set({ key: name, value });
            },
            removeItem: async (name: string): Promise<void> => {
              const { Preferences } = await import('@capacitor/preferences');
              await Preferences.remove({ key: name });
            },
          };
        }
        // Web fallback: standard localStorage
        return localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Alias for backwards compatibility
export const useAuthStore = useAuth;
