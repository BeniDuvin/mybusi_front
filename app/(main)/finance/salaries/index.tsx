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
import { useSalaries, useDeleteSalary } from '@/hooks/useFinance';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import type { SalaryPayment } from '@/types';

export default function SalariesListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryPayment | null>(null);

  const { data, isLoading, error, refetch } = useSalaries({
    page,
    limit: 20,
  });
  const deleteMutation = useDeleteSalary();

  const handleDelete = async () => {
    if (!selectedSalary) return;
    try {
      await deleteMutation.mutateAsync(selectedSalary.id);
      setDeleteDialogVisible(false);
      setSelectedSalary(null);
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const renderSalary = ({ item }: { item: SalaryPayment }) => (
    <Card style={styles.card} onPress={() => router.push(`/finance/salaries/edit/${item.id}`)}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {item.user?.firstName} {item.user?.lastName}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              {item.period} · {formatDate(item.paymentDate)}
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
                router.push(`/finance/salaries/edit/${item.id}`);
              }}
              title="Modifier"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                setSelectedSalary(item);
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
        renderItem={renderSalary}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="person"
              title="Aucun salaire"
              message="Ajoutez un paiement de salaire"
              actionLabel="Nouveau salaire"
              onAction={() => router.push('/finance/salaries/create')}
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
        label="Nouveau salaire"
        style={styles.fab}
        onPress={() => router.push('/finance/salaries/create')}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>Supprimer ce paiement de salaire ?</Text>
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
