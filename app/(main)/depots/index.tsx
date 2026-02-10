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
import { useDepots, useDeleteDepot } from '@/hooks/useDepots';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import type { Depot } from '@/types';

export default function DepotsListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);

  const { data, isLoading, error, refetch } = useDepots({
    page,
    limit: 20,
    search,
  });
  const deleteMutation = useDeleteDepot();

  const handleDelete = async () => {
    if (!selectedDepot) return;
    try {
      await deleteMutation.mutateAsync(selectedDepot.id);
      setDeleteDialogVisible(false);
      setSelectedDepot(null);
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const renderDepot = ({ item }: { item: Depot }) => (
    <Card style={styles.card} onPress={() => router.push(`/depots/edit/${item.id}`)}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              {item.address}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              {item.phone}
            </Text>
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(item.id)} />}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                router.push(`/depots/edit/${item.id}`);
              }}
              title="Modifier"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                setSelectedDepot(item);
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
        <ErrorMessage message={error?.message || 'Erreur lors du chargement'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar placeholder="Rechercher un dépôt..." onSearch={setSearch} />

      <FlatList
        data={data?.data || []}
        renderItem={renderDepot}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="building.2"
              title="Aucun dépôt"
              message="Commencez par ajouter votre premier dépôt"
              actionLabel="Ajouter un dépôt"
              onAction={() => router.push('/depots/create')}
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

      <FAB icon="plus" label="Nouveau dépôt" style={styles.fab} onPress={() => router.push('/depots/create')} />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>Supprimer le dépôt "{selectedDepot?.name}" ?</Text>
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
