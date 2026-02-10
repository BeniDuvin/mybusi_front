import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/utils/constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Avatar, Button, Card, Divider, List, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut, hasRole } = useAuthContext();
  const isAdmin = hasRole(['ADMIN']);

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileHeader}>
            <Avatar.Text
              size={80}
              label={user?.firstName?.[0] || 'U'}
              style={styles.avatar}
            />
            <Text variant="headlineSmall" style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text variant="bodyMedium" style={styles.userEmail}>
              {user?.email}
            </Text>
            <Text variant="bodySmall" style={styles.userRole}>
              {user?.role && ROLE_LABELS[user.role]}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <List.Item
            title="Email"
            description={user?.email}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <Divider />
          <List.Item
            title="Téléphone"
            description={user?.phone || 'Non renseigné'}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <Divider />
          <List.Item
            title="Rôle"
            description={user?.role && ROLE_LABELS[user.role]}
            left={(props) => <List.Icon {...props} icon="shield-account" />}
          />
        </Card>

        <Card style={styles.actionsCard}>
          {isAdmin && (
            <>
              <List.Item
                title="Paramètres"
                left={(props) => <List.Icon {...props} icon="cog" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/settings')}
              />
              <Divider />
            </>
          )}
          <List.Item
            title="Aide"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/help')}
          />
          <Divider />
          <List.Item
            title="À propos"
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/about')}
          />
        </Card>

        {isAdmin && (
          <Card style={styles.adminCard}>
            <Text variant="titleSmall" style={styles.adminTitle}>
              Administration
            </Text>
            <List.Item
              title="Paiements en attente"
              description="Valider ou vérifier les paiements"
              left={(props) => <List.Icon {...props} icon="credit-card-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/payments')}
            />
            <Divider />
            <List.Item
              title="Gestion des utilisateurs"
              description="Rôles et activation des comptes"
              left={(props) => <List.Icon {...props} icon="account-group-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/users')}
            />
            <Divider />
            <List.Item
              title="Tableaux financiers"
              description="Résumé, dépenses et salaires"
              left={(props) => <List.Icon {...props} icon="finance" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/finance')}
            />
            <Divider />
            <List.Item
              title="Gestion des dépôts"
              description="Créer et gérer les dépôts"
              left={(props) => <List.Icon {...props} icon="warehouse" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/depots')}
            />
            <Divider />
            <List.Item
              title="Fournisseurs"
              description="Créer et gérer les fournisseurs"
              left={(props) => <List.Icon {...props} icon="account-tie-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/purchases/suppliers')}
            />
            <Divider />
            <List.Item
              title="Catégories de boissons"
              description="Créer et gérer les catégories"
              left={(props) => <List.Icon {...props} icon="tag" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/products/categories')}
            />
            <Divider />
            <List.Item
              title="Marques"
              description="Créer et gérer les marques"
              left={(props) => <List.Icon {...props} icon="tag-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/products/brands')}
            />
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleLogout}
          icon="logout"
          style={styles.logoutButton}
          buttonColor={theme.colors.error}
        >
          Se déconnecter
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  profileCard: {
    marginBottom: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    marginBottom: Spacing.md,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  userRole: {
    opacity: 0.6,
  },
  infoCard: {
    marginBottom: Spacing.md,
  },
  actionsCard: {
    marginBottom: Spacing.md,
  },
  adminCard: {
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  adminTitle: {
    fontWeight: 'bold',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  logoutButton: {
    marginTop: Spacing.lg,
  },
});
