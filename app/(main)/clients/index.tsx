import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import {
  Card,
  Text,
  FAB,
  useTheme,
  Menu,
  IconButton,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useClients, useDeleteClient } from '@/hooks/useClients';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import type { Client } from '@/types';

export default function ClientsListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data, isLoading, error, refetch } = useClients({
    page,
    limit: 20,
    search,
  });

  const deleteMutation = useDeleteClient();

  const handleDelete = async () => {
    if (!selectedClient) return;

    try {
      await deleteMutation.mutateAsync(selectedClient.id);
      setDeleteDialogVisible(false);
      setSelectedClient(null);
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const renderClient = ({ item }: { item: Client }) => (
    <Card style={styles.card} onPress={() => router.push(`/clients/edit/${item.id}`)}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {item.firstName} {item.lastName}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              {item.phone}
            </Text>
            {item.email ? (
              <Text variant="bodySmall" style={styles.meta}>
                {item.email}
              </Text>
            ) : null}
          </View>

          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(item.id)} />}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                router.push(`/clients/edit/${item.id}`);
              }}
              title="Modifier"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                setSelectedClient(item);
                setDeleteDialogVisible(true);
              }}
              title="Supprimer"
              leadingIcon="delete"
            />
          </Menu>
        </View>
      </Card.Content>
    </Card>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={error?.message || 'Erreur lors du chargement des clients'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar placeholder="Rechercher un client..." onSearch={setSearch} />

      <FlatList
        data={data?.data || []}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="person.2"
              title="Aucun client"
              message="Commencez par ajouter votre premier client"
              actionLabel="Ajouter un client"
              onAction={() => router.push('/clients/create')}
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

      <FAB
        icon="plus"
        label="Nouveau client"
        style={styles.fab}
        onPress={() => router.push('/clients/create')}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>
              Supprimer le client "{selectedClient?.firstName} {selectedClient?.lastName}" ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Annuler</Button>
            <Button
              onPress={handleDelete}
              loading={deleteMutation.isPending}
              textColor={theme.colors.error}
            >
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  meta: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
