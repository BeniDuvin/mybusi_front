import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Avatar, Card, Text, List, Button, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { Spacing } from '@/constants/theme';
import { ROLE_LABELS } from '@/utils/constants';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuthContext();

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
          <List.Item
            title="Paramètres"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Aide"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="À propos"
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </Card>

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
  logoutButton: {
    marginTop: Spacing.lg,
  },
});
