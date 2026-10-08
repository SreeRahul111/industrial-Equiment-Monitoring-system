import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getSafeStorage = (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  };

  const setSafeStorage = (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  };

  const removeSafeStorage = (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  };

  const [user, setUser] = useState<User | null>(() => {
    const saved = getSafeStorage('iems_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return getSafeStorage('iems_auth_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = getSafeStorage('iems_auth_token');
      if (storedToken) {
        try {
          const freshUser = await authApi.getCurrentUser();
          setUser(freshUser);
          setSafeStorage('iems_current_user', JSON.stringify(freshUser));
        } catch {
          removeSafeStorage('iems_auth_token');
          removeSafeStorage('iems_current_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const resp = await authApi.login(email, password);
      setToken(resp.access_token);
      setUser(resp.user);
      setSafeStorage('iems_auth_token', resp.access_token);
      setSafeStorage('iems_current_user', JSON.stringify(resp.user));
      return resp.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      removeSafeStorage('iems_auth_token');
      removeSafeStorage('iems_current_user');
      setUser(null);
      setToken(null);
    }
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
