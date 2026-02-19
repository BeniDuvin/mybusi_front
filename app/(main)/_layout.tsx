import { useAuthContext } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MainLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, hasRole } = useAuthContext();
  const router = useRouter();
  const segments = useSegments();
  const canManage = hasRole(['ADMIN', 'GERANT']);
  const isAdmin = hasRole(['ADMIN']);

  useEffect(() => {
    if (!user) return;

    const currentRoot = segments[1];
    if (!currentRoot) return;

    const adminOnlyRoots = ['users', 'depots', 'settings'];
    const managerRoots = ['finance', 'expenses', 'other-incomes', 'payments'];

    if (adminOnlyRoots.includes(currentRoot) && !isAdmin) {
      router.replace('/profile');
      return;
    }

    if (managerRoots.includes(currentRoot) && !canManage) {
      router.replace('/dashboard');
    }
  }, [user, segments, isAdmin, canManage, router]);

  const tabIcon = (name: React.ComponentProps<typeof MaterialCommunityIcons>['name']) => {
    return ({ focused }: { focused: boolean }) => (
      <MaterialCommunityIcons
        name={name}
        size={22}
        color={focused ? theme.colors.primary : theme.colors.onSurface}
      />
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.outline,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tableau de bord',
          tabBarLabel: 'Dashboard',
          tabBarIcon: tabIcon('chart-bar'),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventes',
          tabBarLabel: 'Ventes',
          tabBarIcon: tabIcon('cart'),
        }}
      />
      <Tabs.Screen
        name="other-incomes"
        options={{
          title: "Entrées d'argent",
          tabBarLabel: 'Entrées',
          tabBarIcon: tabIcon('cash-plus'),
          href: canManage ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Dépenses',
          tabBarLabel: 'Dépenses',
          tabBarIcon: tabIcon('cash-minus'),
          href: canManage ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{
          title: 'Achats',
          tabBarLabel: 'Achat',
          tabBarIcon: tabIcon('cart-arrow-down'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: tabIcon('account-circle-outline'),
        }}
      />

      <Tabs.Screen name="payments/index" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="depots" options={{ href: null }} />
      <Tabs.Screen name="clients" options={{ href: null }} />
      <Tabs.Screen name="finance" options={{ href: null }} />
      <Tabs.Screen name="users/index" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
    </Tabs>
  );
}
