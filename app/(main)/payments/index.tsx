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
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { PickerField } from '@/components/ui/PickerField';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement',
  CREDIT: 'Crédit',
};

const OPERATION_TABS: Array<{ label: string; value: 'sale' | 'purchase' }> = [
  { label: 'Ventes', value: 'sale' },
  { label: 'Achats', value: 'purchase' },
];

const PERIOD_TABS: Array<{ label: string; value: 'range' | 'month' | 'quarter' | 'year' }> = [
  { label: 'Dates', value: 'range' },
  { label: 'Mois', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Année', value: 'year' },
];

const MONTH_OPTIONS = [
  { label: 'Jan', value: '1' },
  { label: 'Fév', value: '2' },
  { label: 'Mar', value: '3' },
  { label: 'Avr', value: '4' },
  { label: 'Mai', value: '5' },
  { label: 'Juin', value: '6' },
  { label: 'Juil', value: '7' },
  { label: 'Aoû', value: '8' },
  { label: 'Sep', value: '9' },
  { label: 'Oct', value: '10' },
  { label: 'Nov', value: '11' },
  { label: 'Déc', value: '12' },
];

const QUARTER_OPTIONS = [
  { label: 'T1', value: '1' },
  { label: 'T2', value: '2' },
  { label: 'T3', value: '3' },
  { label: 'T4', value: '4' },
];

export default function PaymentsScreen() {
  const theme = useTheme();
  const verifyMutation = useVerifyPayment();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();
  const { data: depots } = useDepots();
  const [operationFilter, setOperationFilter] = useState<'sale' | 'purchase'>('sale');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const now = new Date();
  const defaultYear = String(now.getFullYear());
  const defaultMonth = String(now.getMonth() + 1);
  const defaultQuarter = String(Math.floor(now.getMonth() / 3) + 1);
  const [periodMode, setPeriodMode] = useState<'range' | 'month' | 'quarter' | 'year'>('range');
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [monthValue, setMonthValue] = useState(defaultMonth);
  const [quarterValue, setQuarterValue] = useState(defaultQuarter);
  const [yearValue, setYearValue] = useState(defaultYear);

  const toNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getYearNumber = () => {
    const parsed = Number(yearValue);
    return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
  };

  const toStartOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const toEndOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  const { startDate, endDate } = useMemo(() => {
    if (periodMode === 'range') {
      return {
        startDate: rangeStart ? toStartOfDay(rangeStart).toISOString() : undefined,
        endDate: rangeEnd ? toEndOfDay(rangeEnd).toISOString() : undefined,
      };
    }

    const year = getYearNumber();
    if (periodMode === 'month') {
      const month = Number(monthValue) || 1;
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }

    if (periodMode === 'quarter') {
      const quarter = Number(quarterValue) || 1;
      const startMonth = (quarter - 1) * 3;
      const endMonth = startMonth + 3;
      const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
      const end = new Date(year, endMonth, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }

    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [monthValue, periodMode, quarterValue, rangeEnd, rangeStart, yearValue]);

  const { data, isLoading, error, refetch } = usePayments({
    page: 1,
    limit: 200,
    startDate,
    endDate,
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

  const salesById = useMemo(() => {
    const map = new Map<string, (typeof salesData)['data'][number]>();
    salesData?.data?.forEach((sale) => {
      map.set(sale.id, sale);
    });
    return map;
  }, [salesData?.data]);

  const purchaseIds = useMemo(() => {
    const ids = new Set<string>();
    purchasesData?.data?.forEach((purchase) => ids.add(purchase.id));
    return ids;
  }, [purchasesData?.data]);

  const purchasesById = useMemo(() => {
    const map = new Map<string, (typeof purchasesData)['data'][number]>();
    purchasesData?.data?.forEach((purchase) => {
      map.set(purchase.id, purchase);
    });
    return map;
  }, [purchasesData?.data]);

  const purchasePayments = useMemo(() => {
    const list: Payment[] = [];
    purchasesData?.data?.forEach((purchase) => {
      const total = toNumber(purchase.total);
      const computedTotal =
        total ||
        purchase.lines?.reduce(
          (sum, line) =>
            sum + toNumber(line.total ?? toNumber(line.quantity) * toNumber(line.unitPrice)),
          0
        );
      const paidAmount = toNumber(purchase.paidAmount);

      if (purchase.payments?.length) {
        purchase.payments.forEach((payment) => {
          list.push({
            ...payment,
            purchaseId: purchase.id,
          });
        });
        return;
      }

      if (computedTotal > 0) {
        list.push({
          id: `purchase-${purchase.id}`,
          purchaseId: purchase.id,
          amount: paidAmount || computedTotal,
          method: 'CREDIT',
          status: paidAmount >= computedTotal ? 'COMPLETED' : 'PENDING',
          createdAt: purchase.updatedAt || purchase.createdAt,
          updatedAt: purchase.updatedAt || purchase.createdAt,
        });
      }
    });
    return list;
  }, [purchasesData?.data]);

  const allPayments = useMemo(() => {
    const map = new Map<string, Payment>();
    payments.forEach((payment) => map.set(payment.id, payment));
    purchasePayments.forEach((payment) => {
      if (!map.has(payment.id)) {
        map.set(payment.id, payment);
      }
    });
    return Array.from(map.values());
  }, [payments, purchasePayments]);

  const filteredPayments = useMemo(() => {
    let base = allPayments;
    if (startDate || endDate) {
      const startMs = startDate ? new Date(startDate).getTime() : undefined;
      const endMs = endDate ? new Date(endDate).getTime() : undefined;
      base = base.filter((payment) => {
        const createdMs = new Date(payment.createdAt).getTime();
        if (Number.isNaN(createdMs)) return false;
        if (startMs !== undefined && createdMs < startMs) return false;
        if (endMs !== undefined && createdMs > endMs) return false;
        return true;
      });
    }

    if (!selectedDepotId) return base;
    return base.filter(
      (payment) =>
        (payment.saleId && saleIds.has(payment.saleId)) ||
        (payment.purchaseId && purchaseIds.has(payment.purchaseId))
    );
  }, [allPayments, endDate, purchaseIds, saleIds, selectedDepotId, startDate]);

  const displayedPayments = useMemo(() => {
    const base = filteredPayments;
    if (operationFilter === 'sale') {
      return base.filter((payment) => !!payment.saleId);
    }
    return base.filter((payment) => !!payment.purchaseId);
  }, [filteredPayments, operationFilter]);

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
    const relatedSale = item.saleId ? salesById.get(item.saleId) : undefined;
    const relatedPurchase = item.purchaseId ? purchasesById.get(item.purchaseId) : undefined;
    const managerName = relatedSale?.user
      ? `${relatedSale.user.firstName} ${relatedSale.user.lastName}`
      : relatedPurchase?.user
        ? `${relatedPurchase.user.firstName} ${relatedPurchase.user.lastName}`
        : undefined;

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
              {(item.saleId || item.purchaseId) && (
                <Text variant="bodySmall" style={styles.meta}>
                  Opération: {item.saleId ? 'Vente' : 'Achat'}
                </Text>
              )}
              {managerName && (
                <Text variant="bodySmall" style={styles.meta}>
                  Responsable: {managerName}
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
        <PickerField
          variant="filter"
          label="Boutique"
          selectedValue={selectedDepotId || ''}
          onValueChange={(value) => setSelectedDepotId(value)}
          containerStyle={styles.filterPickerField}
        >
          {depots?.data?.map((depot) => (
            <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
          ))}
        </PickerField>
        <Button
          mode="contained"
          onPress={async () => {
            const depotName =
              depots?.data?.find((depot) => depot.id === selectedDepotId)?.name || 'Tous';
            const list = [...displayedPayments].sort(
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
                  <div class="meta">Dépôt: ${depotName} · Filtre: ${
                    operationFilter === 'sale' ? 'Ventes' : 'Achats'
                  }</div>
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

      <View style={styles.periodTabsRow}>
        {PERIOD_TABS.map((tab) => {
          const isActive = tab.value === periodMode;
          return (
            <Button
              key={tab.value}
              mode={isActive ? 'contained' : 'outlined'}
              onPress={() => setPeriodMode(tab.value)}
              style={styles.periodTab}
              compact
            >
              {tab.label}
            </Button>
          );
        })}
      </View>

      {periodMode === 'range' ? (
        <View style={styles.periodRow}>
          <Button
            mode="outlined"
            onPress={() => setShowStartPicker(true)}
            style={styles.dateButton}
          >
            {rangeStart ? `Du: ${formatDate(rangeStart)}` : 'Du: choisir'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowEndPicker(true)}
            style={styles.dateButton}
          >
            {rangeEnd ? `Au: ${formatDate(rangeEnd)}` : 'Au: choisir'}
          </Button>
        </View>
      ) : null}

      {showStartPicker && (
        <DateTimePicker
          value={rangeStart || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (Platform.OS !== 'ios') {
              setShowStartPicker(false);
            }
            if (event.type === 'dismissed') {
              setShowStartPicker(false);
              return;
            }
            if (selectedDate) {
              setRangeStart(selectedDate);
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={rangeEnd || rangeStart || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (Platform.OS !== 'ios') {
              setShowEndPicker(false);
            }
            if (event.type === 'dismissed') {
              setShowEndPicker(false);
              return;
            }
            if (selectedDate) {
              setRangeEnd(selectedDate);
            }
          }}
        />
      )}

      {periodMode === 'month' ? (
        <View style={styles.periodRow}>
          <View style={styles.periodPicker}>
            <Text variant="bodySmall" style={styles.periodLabel}>
              Mois
            </Text>
            <Picker
              selectedValue={monthValue}
              onValueChange={(value) => setMonthValue(String(value))}
              style={styles.periodPickerInput}
              itemStyle={styles.periodPickerItem}
            >
              {MONTH_OPTIONS.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
          <TextInput
            label="Année"
            value={yearValue}
            onChangeText={setYearValue}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.periodInput}
          />
        </View>
      ) : null}

      {periodMode === 'quarter' ? (
        <View style={styles.periodRow}>
          <View style={styles.periodPicker}>
            <Text variant="bodySmall" style={styles.periodLabel}>
              Trimestre
            </Text>
            <Picker
              selectedValue={quarterValue}
              onValueChange={(value) => setQuarterValue(String(value))}
              style={styles.periodPickerInput}
              itemStyle={styles.periodPickerItem}
            >
              {QUARTER_OPTIONS.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
          <TextInput
            label="Année"
            value={yearValue}
            onChangeText={setYearValue}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.periodInput}
          />
        </View>
      ) : null}

      {periodMode === 'year' ? (
        <View style={styles.periodRow}>
          <TextInput
            label="Année"
            value={yearValue}
            onChangeText={setYearValue}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.periodInput}
          />
        </View>
      ) : null}

      <View style={styles.tabsRow}>
        {OPERATION_TABS.map((tab) => {
          const isActive = tab.value === operationFilter;
          return (
            <Button
              key={tab.label}
              mode={isActive ? 'contained' : 'outlined'}
              onPress={() => setOperationFilter(tab.value)}
              style={styles.tabButton}
            >
              {tab.label}
            </Button>
          );
        })}
      </View>

      <FlatList
        data={displayedPayments}
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
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  periodInput: {
    flex: 1,
  },
  dateButton: {
    flex: 1,
  },
  periodTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  periodTab: {
    minWidth: 90,
  },
  periodPicker: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  periodLabel: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
  },
  periodPickerInput: {
    height: 36,
    color: '#111827',
  },
  periodPickerItem: {
    height: 36,
    fontSize: 12,
    color: '#111827',
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
  filterPickerField: {
    flex: 1,
    marginBottom: 0,
  },
  filterPicker: {
    height: 36,
    color: '#111827',
  },
  filterPickerItem: {
    height: 36,
    fontSize: 12,
    color: '#111827',
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
