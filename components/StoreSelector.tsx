import { useDepots } from '@/hooks/useDepots';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/app.store';
import { useCartStore } from '@/stores/cart.store';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Icon, Menu, Text, TouchableRipple, useTheme } from 'react-native-paper';

const roleLabels: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  GERANT: 'Gérant',
  CAISSIER: 'Caissier',
  VENDEUR: 'Vendeur',
  MAGASINIER: 'Magasinier',
};

/** Keeps the active tenant visible and clears tenant-specific UI state when it changes. */
export function StoreSelector() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { data, isLoading } = useDepots({ page: 1, limit: 100 });
  const selectedDepotId = useAppStore((state) => state.selectedDepotId);
  const setSelectedDepotId = useAppStore((state) => state.setSelectedDepotId);
  const [menuVisible, setMenuVisible] = useState(false);
  const previousDepotId = useRef(selectedDepotId);
  const stores = data?.data ?? [];
  const activeStore = stores.find((store) => store.id === selectedDepotId);
  const membership = activeStore?.users?.find((item) => item.userId === user?.id && item.isActive);
  const roleLabel = membership ? roleLabels[membership.role] || membership.role : '';

  useEffect(() => {
    const previousId = previousDepotId.current;
    previousDepotId.current = selectedDepotId;
    if (!previousId || !selectedDepotId || previousId === selectedDepotId) return;

    void queryClient.cancelQueries().then(() => queryClient.resetQueries());
    useCartStore.getState().clear();
    router.replace('/(main)/dashboard');
  }, [queryClient, router, selectedDepotId]);

  const chooseStore = (storeId: string) => {
    setMenuVisible(false);
    if (storeId !== selectedDepotId) setSelectedDepotId(storeId);
  };

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <TouchableRipple
          onPress={() => setMenuVisible(true)}
          disabled={isLoading || stores.length === 0}
          borderless
          style={{ borderRadius: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 }}>
            {isLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Icon source="store-outline" size={22} color={theme.colors.primary} />
            )}
            <View style={{ marginHorizontal: 8, maxWidth: 220 }}>
              <Text variant="titleSmall" numberOfLines={1}>
                {activeStore?.name || (stores.length ? 'Choisir une boutique' : 'Aucune boutique')}
              </Text>
              {!!roleLabel && <Text variant="labelSmall" numberOfLines={1}>{roleLabel} · Boutique active</Text>}
            </View>
            {stores.length > 1 && <Icon source="chevron-down" size={20} color={theme.colors.onSurface} />}
          </View>
        </TouchableRipple>
      }
    >
      {stores.map((store) => {
        const storeMembership = store.users?.find((item) => item.userId === user?.id && item.isActive);
        const storeRole = storeMembership
          ? roleLabels[storeMembership.role] || storeMembership.role
          : '';
        return (
          <Menu.Item
            key={store.id}
            title={storeRole ? `${store.name} · ${storeRole}` : store.name}
            leadingIcon={store.id === selectedDepotId ? 'check-circle' : 'store-outline'}
            onPress={() => chooseStore(store.id)}
          />
        );
      })}
    </Menu>
  );
}
