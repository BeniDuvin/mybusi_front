import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spacing } from '@/constants/theme';
import { usePayments, useSales, useVerifyPayment } from '@/hooks/useSales';
import { usePurchases } from '@/hooks/usePurchases';
import { useDepots } from '@/hooks/useDepots';
import { invoiceService } from '@/services/invoice.service';
import { useAppStore } from '@/stores/app.store';
import type { Payment, PaymentMethod, PaymentStatus } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement',
  CREDIT: 'Crédit',
};

const STATUS_TABS: Array<{ label: string; value?: PaymentStatus }> = [
  { label: 'En attente', value: 'PENDING' },
  { label: 'Tous', value: undefined },
];

export default function PaymentsScreen() {
  const theme = useTheme();
  const verifyMutation = useVerifyPayment();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();
  const { data: depots } = useDepots();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>('PENDING');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = usePayments({
    page: 1,
    limit: 200,
    status: statusFilter,
  });

  const payments = useMemo(() => data?.data || [], [data]);

  const { data: salesData } = useSales({
    depotId: selectedDepotId || undefined,
    limit: 1000,
  });

  const { data: purchasesData } = usePurchases({
    depotId: selectedDepotId || undefined,
    limit: 1000,
  });

  const saleIds = useMemo(() => {
    const ids = new Set<string>();
    salesData?.data?.forEach((sale) => ids.add(sale.id));
    return ids;
  }, [salesData?.data]);

  const purchaseIds = useMemo(() => {
    const ids = new Set<string>();
    purchasesData?.data?.forEach((purchase) => ids.add(purchase.id));
    return ids;
  }, [purchasesData?.data]);

  const filteredPayments = useMemo(() => {
    if (!selectedDepotId) return payments;
    return payments.filter(
      (payment) =>
        (payment.saleId && saleIds.has(payment.saleId)) ||
        (payment.purchaseId && purchaseIds.has(payment.purchaseId))
    );
  }, [payments, purchaseIds, saleIds, selectedDepotId]);

  const handleVerify = async (payment: Payment) => {
    if (payment.method !== 'MOBILE_MONEY') return;
    try {
      setVerifyingId(payment.id);
      await verifyMutation.mutateAsync(payment.id);
    } finally {
      setVerifyingId(null);
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => {
    const isPending = item.status === 'PENDING';
    const canVerify = isPending && item.method === 'MOBILE_MONEY';

    return (
      <Card style={[styles.card, { borderColor: theme.colors.outline }]}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.info}>
              <Text variant="titleMedium" style={styles.title}>
                Paiement {item.id.slice(0, 6).toUpperCase()}
              </Text>
              <Text variant="bodySmall" style={styles.meta}>
                {formatDateTime(item.createdAt)}
              </Text>
              {item.saleId && (
                <Text variant="bodySmall" style={styles.meta}>
                  Vente: {item.saleId.slice(0, 6).toUpperCase()}
                </Text>
              )}
              {item.purchaseId && (
                <Text variant="bodySmall" style={styles.meta}>
                  Achat: {item.purchaseId.slice(0, 6).toUpperCase()}
                </Text>
              )}
            </View>
            <StatusBadge status={item.status} />
          </View>

          <View style={styles.amountRow}>
            <Text variant="bodySmall" style={styles.detailLabel}>
              Montant
            </Text>
            <Text variant="titleMedium" style={[styles.amount, { color: theme.colors.primary }]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>

          <Text variant="bodySmall" style={styles.meta}>
            Méthode: {METHOD_LABELS[item.method] || item.method}
          </Text>

          {item.method === 'MOBILE_MONEY' && item.mobileMoneyProvider && (
            <Text variant="bodySmall" style={styles.meta}>
              Provider: {item.mobileMoneyProvider}
            </Text>
          )}
          {item.mobileMoneyNumber && (
            <Text variant="bodySmall" style={styles.meta}>
              Numéro: {item.mobileMoneyNumber}
            </Text>
          )}
          {item.reference && (
            <Text variant="bodySmall" style={styles.meta}>
              Référence: {item.reference}
            </Text>
          )}

          {canVerify && (
            <Button
              mode="contained"
              onPress={() => handleVerify(item)}
              loading={verifyingId === item.id}
              disabled={verifyingId === item.id}
              style={styles.actionButton}
            >
              Vérifier le paiement
            </Button>
          )}
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
      <View style={styles.filtersRow}>
        <View style={styles.filterItem}>
          <Text variant="bodySmall" style={styles.filterLabel}>
            Dépôt
          </Text>
          <Picker
            selectedValue={selectedDepotId || ''}
            onValueChange={(value) => setSelectedDepotId(value || null)}
            style={styles.filterPicker}
            itemStyle={styles.filterPickerItem}
          >
            <Picker.Item label="Tous" value="" />
            {depots?.data?.map((depot) => (
              <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
            ))}
          </Picker>
        </View>
        <Button
          mode="contained"
          onPress={async () => {
            const depotName =
              depots?.data?.find((depot) => depot.id === selectedDepotId)?.name || 'Tous';
            const list = [...filteredPayments].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const total = list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const rows = list
              .map(
                (item) => `
                  <tr>
                    <td>${formatDateTime(item.createdAt)}</td>
                    <td>${item.saleId ? `Vente ${item.saleId.slice(0, 6).toUpperCase()}` : item.purchaseId ? `Achat ${item.purchaseId.slice(0, 6).toUpperCase()}` : '—'}</td>
                    <td>${METHOD_LABELS[item.method] || item.method}</td>
                    <td>${item.status}</td>
                    <td style="text-align:right;">${formatCurrency(item.amount)}</td>
                  </tr>
                `
              )
              .join('');

            const html = `
              <html>
                <head>
                  <meta charset="utf-8" />
                  <style>
                    body { font-family: Arial, sans-serif; padding: 16px; }
                    h2 { margin: 0 0 4px; }
                    .meta { color: #666; margin-bottom: 16px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border-bottom: 1px solid #eee; padding: 8px; font-size: 12px; }
                    th { text-align: left; background: #f7f7f7; }
                    .total { margin-top: 12px; font-weight: bold; text-align: right; }
                  </style>
                </head>
                <body>
                  <h2>Rapport des paiements</h2>
                  <div class="meta">Dépôt: ${depotName} · Filtre: ${statusFilter || 'Tous'}</div>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Référence</th>
                        <th>Méthode</th>
                        <th>Statut</th>
                        <th style="text-align:right;">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rows || '<tr><td colspan="5">Aucun paiement</td></tr>'}
                    </tbody>
                  </table>
                  <div class="total">Total: ${formatCurrency(total)}</div>
                </body>
              </html>
            `;
            await invoiceService.printHtml(html);
          }}
          style={styles.printButton}
        >
          Imprimer
        </Button>
      </View>

      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === statusFilter;
          return (
            <Button
              key={tab.label}
              mode={isActive ? 'contained' : 'outlined'}
              onPress={() => setStatusFilter(tab.value)}
              style={styles.tabButton}
            >
              {tab.label}
            </Button>
          );
        })}
      </View>

      <FlatList
        data={filteredPayments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="creditcard"
              title="Aucun paiement"
              message="Les paiements en attente apparaîtront ici"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: 0,
    alignItems: 'flex-end',
  },
  filterItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  filterLabel: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
  },
  filterPicker: {
    height: 36,
  },
  filterPickerItem: {
    height: 36,
    fontSize: 12,
  },
  printButton: {
    marginBottom: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  tabButton: {
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
    marginTop: Spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: Spacing.sm,
  },
  detailLabel: {
    opacity: 0.6,
  },
  amount: {
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: Spacing.md,
  },
});
