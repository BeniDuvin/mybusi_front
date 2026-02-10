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
import { useExpenses, useDeleteExpense } from '@/hooks/useFinance';
import { useAppStore } from '@/stores/app.store';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Expense } from '@/types';

export default function ExpensesListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();

  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data, isLoading, error, refetch } = useExpenses({
    page,
    limit: 20,
    depotId: selectedDepotId || undefined,
  });
  const deleteMutation = useDeleteExpense();

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try {
      await deleteMutation.mutateAsync(selectedExpense.id);
      setDeleteDialogVisible(false);
      setSelectedExpense(null);
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <Card style={styles.card} onPress={() => router.push(`/finance/expenses/edit/${item.id}`)}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {item.category}
            </Text>
            {item.description ? (
              <Text variant="bodySmall" style={styles.meta}>
                {item.description}
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
                router.push(`/finance/expenses/edit/${item.id}`);
              }}
              title="Modifier"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                setSelectedExpense(item);
                setDeleteDialogVisible(true);
              }}
              title="Supprimer"
              leadingIcon="delete"
            />
          </Menu>
        </View>
        <Text variant="titleSmall" style={[styles.amount, { color: theme.colors.primary }]}>
          {formatCurrency(item.amount)}
        </Text>
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
      <FlatList
        data={data?.data || []}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="tray"
              title="Aucune dépense"
              message="Ajoutez votre première dépense"
              actionLabel="Nouvelle dépense"
              onAction={() => router.push('/finance/expenses/create')}
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
        label="Nouvelle dépense"
        style={styles.fab}
        onPress={() => router.push('/finance/expenses/create')}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>Supprimer cette dépense ?</Text>
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
  amount: {
    marginTop: Spacing.sm,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
