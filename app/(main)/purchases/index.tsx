import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePurchases, useSuppliers } from '@/hooks/usePurchases';
import { useDepots } from '@/hooks/useDepots';
import { useAppStore } from '@/stores/app.store';
import type { Purchase } from '@/types';
import { PURCHASE_STATUS_LABELS } from '@/utils/constants';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
    Card,
    FAB,
    IconButton,
    Menu,
    Text,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PurchasesListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();
  const isAdmin = useAuthContext().hasRole(['ADMIN']);

  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [depotId, setDepotId] = useState(selectedDepotId || '');
  const [supplierId, setSupplierId] = useState('');

  const { data: depots } = useDepots();
  const { data: suppliers } = useSuppliers();

  const { data, isLoading, error, refetch } = usePurchases({
    page,
    limit: 20,
    depotId: depotId || selectedDepotId || undefined,
    supplierId: supplierId || undefined,
    search: searchQuery.trim() || undefined,
  });

  React.useEffect(() => {
    if (!depotId && selectedDepotId) {
      setDepotId(selectedDepotId);
    }
  }, [selectedDepotId, depotId]);

  const toNumber = (value?: number) =>
    typeof value === 'number' && !Number.isNaN(value) ? value : 0;

  const getLineTotal = (line: Purchase['lines'][number]) => {
    const lineTotal = toNumber(line.total);
    if (lineTotal > 0) return lineTotal;
    return toNumber(line.quantity) * toNumber(line.unitPrice);
  };

  const getPurchaseTotal = (purchase: Purchase) => {
    const total = toNumber(purchase.total);
    if (total > 0) return total;
    return (purchase.lines || []).reduce((sum, line) => sum + getLineTotal(line), 0);
  };

  const getPaidAmount = (purchase: Purchase) => {
    if (typeof purchase.paidAmount === 'number') return toNumber(purchase.paidAmount);
    return (purchase.payments || [])
      .filter((payment) => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  };

  const renderPurchase = ({ item }: { item: Purchase }) => {
    const total = getPurchaseTotal(item);
    const paidAmount = getPaidAmount(item);
    const remaining = Math.max(total - paidAmount, 0);

    return (
    <Card
      style={[styles.card, { borderColor: theme.colors.outline }]}
      onPress={() => isAdmin && router.push(`/purchases/edit/${item.id}`)}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.title}>
              Achat {item.id.slice(0, 6).toUpperCase()}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              {formatDateTime(item.createdAt)}
            </Text>
            {item.supplier && (
              <Text variant="bodySmall" style={styles.meta}>
                Fournisseur: {item.supplier.name}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.meta}>
              Dépôt: {item.depot?.name || item.depotId}
            </Text>
          </View>

          {isAdmin && (
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(item.id)} />}
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  router.push(`/purchases/edit/${item.id}`);
                }}
                title="Modifier"
                leadingIcon="pencil"
              />
            </Menu>
          )}
        </View>

        <View style={styles.summaryRow}>
          <View>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Articles
            </Text>
            <Text variant="titleSmall">{item.lines?.length || 0}</Text>
          </View>
          <View>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Total
            </Text>
            <Text variant="titleSmall" style={[styles.amount, { color: theme.colors.primary }]}>
              {formatCurrency(total)}
            </Text>
          </View>
          <View>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Payé
            </Text>
            <Text variant="titleSmall">{formatCurrency(paidAmount)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <StatusBadge status={item.status} />
          <Text variant="bodySmall" style={styles.meta}>
            {PURCHASE_STATUS_LABELS[item.status] || item.status} • Reste: {formatCurrency(remaining)}
          </Text>
        </View>
      </Card.Content>
    </Card>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error?.message || 'Erreur lors du chargement'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar
        placeholder="Rechercher un achat..."
        value={searchQuery}
        onSearch={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
      />

      <View style={styles.filtersRow}>
        <View style={styles.filterItem}>
          <Text variant="bodySmall" style={styles.filterLabel}>
            Dépôt
          </Text>
          <Picker
            selectedValue={depotId || selectedDepotId || ''}
            onValueChange={(value) => {
              setDepotId(value);
              setSelectedDepotId(value || null);
              setPage(1);
            }}
            style={styles.filterPicker}
            itemStyle={styles.filterPickerItem}
          >
            <Picker.Item label="Tous" value="" />
            {depots?.data?.map((depot) => (
              <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.filterItem}>
          <Text variant="bodySmall" style={styles.filterLabel}>
            Fournisseur
          </Text>
          <Picker
            selectedValue={supplierId}
            onValueChange={(value) => {
              setSupplierId(value);
              setPage(1);
            }}
            style={styles.filterPicker}
            itemStyle={styles.filterPickerItem}
          >
            <Picker.Item label="Tous" value="" />
            {suppliers?.data?.map((supplier) => (
              <Picker.Item key={supplier.id} label={supplier.name} value={supplier.id} />
            ))}
          </Picker>
        </View>
      </View>

      <FlatList
        data={data?.data || []}
        renderItem={renderPurchase}
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
              icon="shippingbox"
              title="Aucun achat"
              message={isAdmin ? 'Créez votre premier achat' : 'Aucun achat enregistré'}
              actionLabel={isAdmin ? 'Nouvel achat' : undefined}
              onAction={isAdmin ? () => router.push('/purchases/create') : undefined}
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

      {isAdmin && (
        <FAB
          icon="plus"
          label="Nouvel achat"
          style={styles.fab}
          onPress={() => router.push('/purchases/create')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    height: 62,
    justifyContent: 'center',
  },
  filterLabel: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    opacity: 0.6,
    fontSize: 11,
  },
  filterPicker: {
    height: 34,
    marginTop: -2,
    color: '#111827',
  },
  filterPickerItem: {
    height: 34,
    fontSize: 12,
    color: '#111827',
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: Spacing.sm,
  },
  detailLabel: {
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  footer: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
