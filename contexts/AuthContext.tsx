import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/services/auth.service';
import type { User } from '@/types';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authService.getMe();
      setUser(userData);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to load user:', e);
      const status = (e as any)?.response?.status;
      if (status === 401) {
        await authService.clearTokens();
      } else {
        const cached = await SecureStore.getItemAsync('user');
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            // ignore cache parse errors
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (accessToken: string, refreshToken: string, userData: User) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('userId', userData.id);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    setUser(userData);
  };

  const signOut = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    }
  };

  const hasRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const refreshUser = async () => {
    await loadUser();
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
