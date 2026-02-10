import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SearchBar } from '@/components/ui/SearchBar';
import { Spacing } from '@/constants/theme';
import { useCreateUser, useUpdateUser, useUsers } from '@/hooks/useUsers';
import type { Role, User } from '@/types';
import { ROLE_LABELS } from '@/utils/constants';
import { isValidEmail, isValidPhone } from '@/utils/validation';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
  Card,
  Chip,
  IconButton,
  Menu,
  Portal,
  Dialog,
  Snackbar,
  TextInput,
  Button,
  Switch,
  Text,
  useTheme,
  FAB,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

const ROLE_OPTIONS: Role[] = ['ADMIN', 'GERANT', 'CAISSIER', 'CLIENT'];

export default function UsersListScreen() {
  const theme = useTheme();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'GERANT' as Role,
    password: '',
    isActive: true,
  });

  const { data, isLoading, error: fetchError, refetch } = useUsers({
    page,
    limit: 20,
    search: searchQuery.trim() || undefined,
  });

  const handleUpdate = async (id: string, data: Partial<User>) => {
    try {
      await updateUser.mutateAsync({ id, data });
      setSuccess('Utilisateur mis à jour');
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || 'Erreur lors de la mise à jour');
    }
  };

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'GERANT',
      password: '',
      isActive: true,
    });
  };

  const handleCreate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Prénom, nom et email sont obligatoires');
      return;
    }
    if (!isValidEmail(form.email.trim())) {
      setError('Email invalide');
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone.trim())) {
      setError('Téléphone invalide');
      return;
    }
    try {
      await createUser.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        password: form.password.trim() || undefined,
        isActive: form.isActive,
      });
      setSuccess('Utilisateur créé');
      setCreateVisible(false);
      resetForm();
      refetch();
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || 'Erreur lors de la création');
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    return (
      <Card style={[styles.card, { borderColor: theme.colors.outline }]}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.info}>
              <Text variant="titleMedium" style={styles.title}>
                {item.firstName} {item.lastName}
              </Text>
              <Text variant="bodySmall" style={styles.meta}>
                {item.email}
              </Text>
              <Text variant="bodySmall" style={styles.meta}>
                {item.phone || 'Téléphone non renseigné'}
              </Text>
            </View>
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton icon="dots-vertical" onPress={() => setMenuVisible(item.id)} />
              }
            >
              <Menu.Item
                title={item.isActive ? 'Désactiver' : 'Activer'}
                leadingIcon={item.isActive ? 'account-off-outline' : 'account-check-outline'}
                onPress={() => {
                  setMenuVisible(null);
                  handleUpdate(item.id, { isActive: !item.isActive });
                }}
              />
              {ROLE_OPTIONS.map((role) => (
                <Menu.Item
                  key={role}
                  title={`Passer en ${ROLE_LABELS[role]}`}
                  leadingIcon="shield-account"
                  onPress={() => {
                    setMenuVisible(null);
                    handleUpdate(item.id, { role });
                  }}
                />
              ))}
            </Menu>
          </View>

          <View style={styles.row}>
            <Chip style={styles.roleChip}>{ROLE_LABELS[item.role] || item.role}</Chip>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: item.isActive ? theme.colors.primary : theme.colors.error },
              ]}
              textStyle={styles.statusText}
            >
              {item.isActive ? 'Actif' : 'Inactif'}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (fetchError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={fetchError?.message || 'Erreur lors du chargement'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar
        placeholder="Rechercher un utilisateur..."
        value={searchQuery}
        onSearch={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
      />

      <FlatList
        data={data?.data || []}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              setPage(1);
              refetch();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="person.2"
              title="Aucun utilisateur"
              message="Aucun résultat pour cette recherche"
            />
          ) : null
        }
        onEndReached={() => {
          if (data?.meta && page < data.meta.totalPages) {
            setPage(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={2000}>
        {success}
      </Snackbar>

      <Portal>
        <Dialog visible={createVisible} onDismiss={() => setCreateVisible(false)}>
          <Dialog.Title>Nouvel utilisateur</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Prénom *"
              value={form.firstName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, firstName: value }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Nom *"
              value={form.lastName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, lastName: value }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email *"
              value={form.email}
              onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              label="Téléphone"
              value={form.phone}
              onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <View style={styles.pickerContainer}>
              <Text variant="bodySmall" style={styles.pickerLabel}>
                Rôle *
              </Text>
              <Picker
                selectedValue={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value as Role }))
                }
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {ROLE_OPTIONS.map((role) => (
                  <Picker.Item key={role} label={ROLE_LABELS[role]} value={role} />
                ))}
              </Picker>
            </View>
            <TextInput
              label="Mot de passe (optionnel)"
              value={form.password}
              onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <View style={styles.switchRow}>
              <Text variant="bodyMedium">Activer le compte</Text>
              <Switch
                value={form.isActive}
                onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
                color={theme.colors.primary}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateVisible(false)}>Annuler</Button>
            <Button
              mode="contained"
              onPress={handleCreate}
              loading={createUser.isLoading}
              disabled={createUser.isLoading}
            >
              Créer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        label="Ajouter"
        style={styles.fab}
        onPress={() => setCreateVisible(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  meta: {
    opacity: 0.7,
  },
  row: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleChip: {
    borderRadius: 999,
  },
  statusChip: {
    borderRadius: 999,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  pickerLabel: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
  },
  picker: {
    height: 36,
  },
  pickerItem: {
    height: 36,
    fontSize: 12,
  },
  switchRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
