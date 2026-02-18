import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { useDepots } from '@/hooks/useDepots';
import { useCancelSale, useSales } from '@/hooks/useSales';
import { useAppStore } from '@/stores/app.store';
import type { Sale } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Dialog,
    FAB,
    IconButton,
    Menu,
    Portal,
    Text,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SalesListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [depotId, setDepotId] = useState(selectedDepotId || '');

  const { data: depots } = useDepots();

  const { data, isLoading, error, refetch } = useSales({
    page,
    limit: 20,
    depotId: depotId || selectedDepotId || undefined,
  });
  const cancelMutation = useCancelSale();

  const toNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getLineTotal = (line: Sale['lines'][number]) => {
    const lineTotal = toNumber(line.total);
    if (lineTotal > 0) return lineTotal;
    return toNumber(line.quantity) * toNumber(line.unitPrice) - toNumber(line.discount);
  };

  const getSaleTotal = (sale: Sale) => {
    const total = toNumber(sale.total);
    if (total > 0) return total;
    const subtotal = (sale.lines || []).reduce((sum, line) => sum + getLineTotal(line), 0);
    return subtotal - toNumber(sale.discount) + toNumber(sale.tax);
  };

  const getPaidAmount = (sale: Sale) =>
    (sale.payments || [])
      .filter((payment) => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  React.useEffect(() => {
    if (!depotId && selectedDepotId) {
      setDepotId(selectedDepotId);
    }
  }, [selectedDepotId, depotId]);

  const handleCancel = async () => {
    if (!selectedSale) return;
    try {
      await cancelMutation.mutateAsync(selectedSale.id);
      setCancelDialogVisible(false);
      setSelectedSale(null);
      refetch();
    } catch (err) {
      console.error('Cancel sale error:', err);
    }
  };

  const renderSale = ({ item }: { item: Sale }) => {
    const total = getSaleTotal(item);
    const paidAmount = getPaidAmount(item);
    const remaining = Math.max(total - paidAmount, 0);

    return (
      <Card style={styles.saleCard} onPress={() => router.push(`/sales/invoice/${item.id}`)}>
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

          <View style={styles.headerActions}>
            <StatusBadge status={item.status} />
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(item.id)} />}
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  router.push(`/sales/invoice/${item.id}`);
                }}
                title="Voir facture"
                leadingIcon="receipt"
              />
              {item.status !== 'CANCELLED' && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    setSelectedSale(item);
                    setCancelDialogVisible(true);
                  }}
                  title="Annuler la vente"
                  leadingIcon="close-circle"
                />
              )}
            </Menu>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={styles.metaText}>
            Dépôt: {item.depot?.name || item.depotId}
          </Text>
          {item.user && (
            <Text variant="bodySmall" style={styles.metaText}>
              Agent: {item.user.firstName} {item.user.lastName}
            </Text>
          )}
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
                {formatCurrency(total)}
              </Text>
            </View>
            <View>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Payé
              </Text>
              <Text variant="titleSmall" style={styles.total}>
                {formatCurrency(paidAmount)}
              </Text>
            </View>
          </View>

          <View style={styles.paymentRow}>
            <StatusBadge status={paidAmount >= total ? 'COMPLETED' : 'PENDING'} />
            <Text variant="bodySmall" style={styles.metaText}>
              Reste: {formatCurrency(remaining)}
            </Text>
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
  };

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
      </View>

      <FlatList
        data={data?.data || []}
        renderItem={renderSale}
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

      <Portal>
        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>Annuler la vente</Dialog.Title>
          <Dialog.Content>
            <Text>
              Annuler la vente "{selectedSale?.invoiceNumber}" ? Cette action est irréversible.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>Annuler</Button>
            <Button
              onPress={handleCancel}
              loading={cancelMutation.isPending}
              textColor={theme.colors.error}
            >
              Confirmer
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
  saleCard: {
    marginBottom: Spacing.md,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
  metaRow: {
    marginBottom: Spacing.xs,
  },
  metaText: {
    opacity: 0.7,
  },
  clientName: {
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: Spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
