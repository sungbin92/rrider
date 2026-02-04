'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User, LoginCredentials, RegisterCredentials } from './types';
import { loginApi, registerApi, refreshTokenApi, getMeApi } from './api';
import { getTokens, setTokens, updateAccessToken, clearTokens } from './storage';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    async function initAuth() {
      const tokens = getTokens();

      if (!tokens) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getMeApi(tokens.accessToken);
        setUser(userData);
      } catch {
        try {
          const refreshed = await refreshTokenApi();
          updateAccessToken(refreshed.accessToken);
          const userData = await getMeApi(refreshed.accessToken);
          setUser(userData);
        } catch {
          clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginApi(credentials);
    setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
    setUser(response.user);
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await registerApi(credentials);
    setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await refreshTokenApi();
      updateAccessToken(response.accessToken);
      return true;
    } catch {
      clearTokens();
      setUser(null);
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      refreshAuth,
    }),
    [user, isAuthenticated, isLoading, login, register, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
