import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/services/auth.service';
import type { User } from '@/types';
import { useAppStore } from '@/stores/app.store';

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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await authService.getMe();
      setUser(userData);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
        await authService.clearTokens();
        await SecureStore.deleteItemAsync('user');
        await useAppStore.getState().setSelectedDepotId(null);
        queryClient.clear();
        setUser(null);
      } else {
        console.warn('Could not load user profile.', status ?? 'network error');
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
    // A device may be shared; never reuse another account's tenant context or cached records.
    queryClient.clear();
    await useAppStore.getState().setSelectedDepotId(null);
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
      await useAppStore.getState().setSelectedDepotId(null);
      queryClient.clear();
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
    void useAppStore.getState().hydrateSelectedDepotId();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
