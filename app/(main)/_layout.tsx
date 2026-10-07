import { useAuthContext } from '@/contexts/AuthContext';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoreSelector } from '@/components/StoreSelector';

export default function MainLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, hasRole } = useAuthContext();
  const { memberRole, isOwner, canManageStore, canSell } = useStoreAccess();
  const isGlobalAdmin = hasRole(['ADMIN']);
  const router = useRouter();
  const segments = useSegments();
  const canManage = canManageStore;
  const isAdmin = isGlobalAdmin;

  useEffect(() => {
    if (!user) return;

    const currentRoot = segments[1];
    if (!currentRoot) return;

    const adminOnlyRoots = ['users', 'settings'];
    const ownerOnlyRoots = ['depots'];
    const managerRoots = ['finance', 'expenses', 'other-incomes', 'payments', 'purchases'];

    if (adminOnlyRoots.includes(currentRoot) && !isAdmin) {
      router.replace('/profile');
      return;
    }
    if (ownerOnlyRoots.includes(currentRoot) && !isOwner) {
      router.replace('/profile');
      return;
    }

    if (managerRoots.includes(currentRoot) && !canManage) {
      router.replace('/dashboard');
    }
    if (currentRoot === 'sales' && !canSell) router.replace('/dashboard');
  }, [user, segments, isAdmin, isOwner, canManage, canSell, router]);

  const tabIcon = (name: React.ComponentProps<typeof MaterialCommunityIcons>['name']) => {
    const TabIcon = ({ focused }: { focused: boolean }) => (
      <MaterialCommunityIcons
        name={name}
        size={22}
        color={focused ? theme.colors.primary : theme.colors.onSurface}
      />
    );
    TabIcon.displayName = `TabIcon(${name})`;
    return TabIcon;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <StoreSelector />,
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: theme.colors.background },
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
          href: canManage && !!memberRole ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Dépenses',
          tabBarLabel: 'Dépenses',
          tabBarIcon: tabIcon('cash-minus'),
          href: canManage && !!memberRole ? undefined : null,
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
      <Tabs.Screen name="onboarding-store" options={{ href: null }} />
      <Tabs.Screen name="members" options={{ href: null }} />
      <Tabs.Screen name="force-change-password" options={{ href: null }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
    </Tabs>
  );
}
