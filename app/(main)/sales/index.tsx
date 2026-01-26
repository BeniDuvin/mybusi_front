import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Card, Text, FAB, useTheme, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSales } from '@/hooks/useSales';
import { useAppStore } from '@/stores/app.store';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Sale } from '@/types';

export default function SalesListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useSales({
    page,
    limit: 20,
    depotId: selectedDepotId || undefined,
  });

  const renderSale = ({ item }: { item: Sale }) => (
    <Card
      style={styles.saleCard}
      onPress={() => router.push(`/sales/invoice/${item.id}`)}
    >
      <Card.Content>
        <View style={styles.saleHeader}>
          <View style={styles.saleInfo}>
            <Text variant="titleMedium" style={styles.invoiceNumber}>
              {item.invoiceNumber}
            </Text>
            <Text variant="bodySmall" style={styles.saleDate}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>

          <StatusBadge status={item.status} />
        </View>

        {item.client && (
          <Text variant="bodyMedium" style={styles.clientName}>
            Client: {item.client.firstName} {item.client.lastName}
          </Text>
        )}

        <View style={styles.saleDetails}>
          <View>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Articles
            </Text>
            <Text variant="titleSmall">{item.lines?.length || 0}</Text>
          </View>
          <View>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Montant total
            </Text>
            <Text variant="titleSmall" style={[styles.total, { color: theme.colors.primary }]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <IconButton
            icon="receipt"
            size={20}
            onPress={() => router.push(`/sales/invoice/${item.id}`)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={error?.message || 'Erreur lors du chargement des ventes'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar placeholder="Rechercher une vente..." onSearch={setSearch} />

      <FlatList
        data={data?.data || []}
        renderItem={renderSale}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="cart"
              title="Aucune vente"
              message="Commencez par créer votre première vente"
              actionLabel="Nouvelle vente"
              onAction={() => router.push('/sales/create')}
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
        icon="cart-plus"
        label="Nouvelle vente"
        style={styles.fab}
        onPress={() => router.push('/sales/create')}
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
  saleCard: {
    marginBottom: Spacing.md,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  saleInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  saleDate: {
    opacity: 0.6,
  },
  clientName: {
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  total: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
