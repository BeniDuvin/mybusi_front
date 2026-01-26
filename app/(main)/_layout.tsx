import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, StyleSheet } from 'react-native';
import { Avatar, Text, Divider, useTheme } from 'react-native-paper';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/utils/constants';
import { Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

function CustomDrawerContent(props: any) {
  const { user, signOut } = useAuthContext();
  const theme = useTheme();

  return (
    <DrawerContentScrollView {...props}>
      <View style={[styles.userInfo, { backgroundColor: theme.colors.primaryContainer }]}>
        <Avatar.Text size={64} label={user?.firstName?.[0] || 'U'} />
        <Text variant="titleMedium" style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text variant="bodySmall" style={styles.userRole}>
          {user?.role && ROLE_LABELS[user.role]}
        </Text>
      </View>

      <Divider />

      <DrawerItemList {...props} />

      <Divider style={styles.divider} />
    </DrawerContentScrollView>
  );
}

export default function MainLayout() {
  const { user, hasRole } = useAuthContext();
  const theme = useTheme();

  const getIcon = (name: any) => {
    return () => (
      <SymbolView name={name as any} size={24} tintColor={theme.colors.onSurface} type="hierarchical" />
    );
  };

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurface,
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          drawerLabel: 'Tableau de bord',
          title: 'Tableau de bord',
          drawerIcon: getIcon('chart.bar'),
        }}
      />

      {hasRole(['ADMIN', 'GERANT']) && (
        <Drawer.Screen
          name="depots"
          options={{
            drawerLabel: 'Dépôts',
            title: 'Dépôts',
            drawerIcon: getIcon('building.2'),
          }}
        />
      )}

      <Drawer.Screen
        name="products"
        options={{
          drawerLabel: 'Produits',
          title: 'Produits',
          drawerIcon: getIcon('cube.box'),
        }}
      />

      <Drawer.Screen
        name="sales"
        options={{
          drawerLabel: 'Ventes',
          title: 'Ventes',
          drawerIcon: getIcon('cart'),
        }}
      />

      {hasRole(['ADMIN', 'GERANT']) && (
        <Drawer.Screen
          name="purchases"
          options={{
            drawerLabel: 'Achats',
            title: 'Achats',
            drawerIcon: getIcon('shippingbox'),
          }}
        />
      )}

      <Drawer.Screen
        name="clients"
        options={{
          drawerLabel: 'Clients',
          title: 'Clients',
          drawerIcon: getIcon('person.2'),
        }}
      />

      {hasRole(['ADMIN', 'GERANT']) && (
        <Drawer.Screen
          name="finance"
          options={{
            drawerLabel: 'Finance',
            title: 'Finance',
            drawerIcon: getIcon('dollarsign.circle'),
          }}
        />
      )}

      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Profil',
          title: 'Mon Profil',
          drawerIcon: getIcon('person'),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  userInfo: {
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    marginTop: Spacing.md,
    fontWeight: 'bold',
  },
  userRole: {
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  divider: {
    marginVertical: Spacing.md,
  },
});
