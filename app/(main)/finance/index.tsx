import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCashFlow, useExpenses, useOtherIncomes, useSalaries } from '@/hooks/useFinance';
import { useSales } from '@/hooks/useSales';
import { usePurchases } from '@/hooks/usePurchases';
import { useAppStore } from '@/stores/app.store';
import { formatCurrency } from '@/utils/format';
import { Spacing } from '@/constants/theme';
import { useDepots } from '@/hooks/useDepots';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

export default function FinanceHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();
  const { data: depots } = useDepots();

  const now = new Date();
  const defaultYear = String(now.getFullYear());
  const defaultMonth = String(now.getMonth() + 1);
  const defaultQuarter = String(Math.floor(now.getMonth() / 3) + 1);
  const [periodMode, setPeriodMode] = useState<'range' | 'month' | 'quarter' | 'year'>('month');
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

  const toStartOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const toEndOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  const getYearNumber = () => {
    const parsed = Number(yearValue);
    return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
  };

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


  const { data: salesData } = useSales({
    depotId: selectedDepotId || undefined,
    startDate,
    endDate,
    limit: 1000,
  });

  const { data: purchasesData } = usePurchases({
    depotId: selectedDepotId || undefined,
    limit: 1000,
  });

  const { data: expensesData } = useExpenses({
    depotId: selectedDepotId || undefined,
    startDate,
    endDate,
    limit: 1000,
  });

  const { data: salariesData } = useSalaries({
    startDate,
    endDate,
    limit: 1000,
  });
  const { data: otherIncomesData } = useOtherIncomes({
    depotId: selectedDepotId || undefined,
    startDate,
    endDate,
    limit: 1000,
  });
  const { data: cashFlowData } = useCashFlow({
    depotId: selectedDepotId || undefined,
    startDate,
    endDate,
  });
  const cashFlowList = useMemo(() => {
    if (Array.isArray(cashFlowData)) return cashFlowData;
    const maybeData = (cashFlowData as any)?.data;
    return Array.isArray(maybeData) ? maybeData : [];
  }, [cashFlowData]);

  const computedTotals = useMemo(() => {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : 0;

    const salesList = salesData?.data ?? (Array.isArray(salesData) ? salesData : []);
    const purchasesList = purchasesData?.data ?? (Array.isArray(purchasesData) ? purchasesData : []);
    const expensesList = expensesData?.data ?? (Array.isArray(expensesData) ? expensesData : []);
    const salariesList = salariesData?.data ?? (Array.isArray(salariesData) ? salariesData : []);
    const otherIncomesList =
      otherIncomesData?.data ?? (Array.isArray(otherIncomesData) ? otherIncomesData : []);

    const getSaleTotal = (sale: { total?: unknown; lines?: Array<{ total?: unknown; quantity?: unknown; unitPrice?: unknown; discount?: unknown }>; discount?: unknown; tax?: unknown }) => {
      const t = toNumber(sale?.total);
      if (t > 0) return t;
      const subtotal = (sale?.lines || []).reduce((sum, line) => {
        const lineTotal = toNumber(line.total);
        if (lineTotal > 0) return sum + lineTotal;
        return sum + toNumber(line.quantity) * toNumber(line.unitPrice) - toNumber(line.discount);
      }, 0);
      return subtotal - toNumber(sale?.discount) + toNumber(sale?.tax);
    };

    const getPurchaseTotal = (p: { total?: unknown; lines?: Array<{ quantity?: unknown; unitPrice?: unknown }> }) => {
      const t = toNumber(p?.total);
      if (t > 0) return t;
      return (p?.lines || []).reduce(
        (sum, line) => sum + toNumber(line.quantity) * toNumber(line.unitPrice),
        0
      );
    };

    let sales = 0;
    salesList.forEach((s: { createdAt?: string; total?: unknown; lines?: Array<{ total?: unknown; quantity?: unknown; unitPrice?: unknown; discount?: unknown }>; discount?: unknown; tax?: unknown }) => {
      const ts = new Date(s.createdAt || 0).getTime();
      if (!start || !end || (ts >= start && ts <= end)) sales += getSaleTotal(s);
    });

    let purchases = 0;
    purchasesList.forEach((p: { createdAt?: string; total?: unknown; lines?: Array<{ quantity?: unknown; unitPrice?: unknown }> }) => {
      const ts = new Date(p.createdAt || 0).getTime();
      if (!start || !end || (ts >= start && ts <= end)) purchases += getPurchaseTotal(p);
    });

    let expenses = 0;
    expensesList.forEach((e: { createdAt?: string; amount?: unknown }) => {
      const ts = new Date(e.createdAt || 0).getTime();
      if (!start || !end || (ts >= start && ts <= end)) expenses += toNumber(e.amount);
    });

    let salaries = 0;
    salariesList.forEach((s: { paymentDate?: string; createdAt?: string; amount?: unknown }) => {
      const ts = new Date(s.paymentDate || s.createdAt || 0).getTime();
      if (!start || !end || (ts >= start && ts <= end)) salaries += toNumber(s.amount);
    });

    let otherIncomes = 0;
    otherIncomesList.forEach((income: { createdAt?: string; amount?: unknown }) => {
      const ts = new Date(income.createdAt || 0).getTime();
      if (!start || !end || (ts >= start && ts <= end)) otherIncomes += toNumber(income.amount);
    });

    return { sales, purchases, expenses, salaries, otherIncomes };
  }, [
    salesData?.data,
    purchasesData?.data,
    expensesData?.data,
    salariesData?.data,
    otherIncomesData?.data,
    startDate,
    endDate,
  ]);

  const totalSales = computedTotals.sales;
  const totalOtherIncomes = computedTotals.otherIncomes;
  const totalIncome = totalSales + totalOtherIncomes;
  const totalPurchases = computedTotals.purchases;
  const totalExpenses = computedTotals.expenses;
  const totalSalaries = computedTotals.salaries;
  const netProfit = totalIncome - totalPurchases - totalExpenses - totalSalaries;

  const assets = totalIncome;
  const liabilities = totalPurchases + totalExpenses + totalSalaries;
  const totalFlow = assets + liabilities;
  const assetsRatio = totalFlow > 0 ? assets / totalFlow : 0;
  const liabilitiesRatio = totalFlow > 0 ? liabilities / totalFlow : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          Finance
        </Text>

        <View style={styles.quickTabsRow}>
          <Button mode="outlined" onPress={() => router.push('/finance/expenses')}>
            Dépenses
          </Button>
          <Button mode="outlined" onPress={() => router.push('/finance/salaries')}>
            Salaires
          </Button>
          <Button mode="contained" onPress={() => router.push('/finance/other-incomes')}>
            Autres entrées
          </Button>
        </View>

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
        </View>

        <View style={styles.periodTabsRow}>
          {[
            { label: 'Dates', value: 'range' },
            { label: 'Mois', value: 'month' },
            { label: 'Trimestre', value: 'quarter' },
            { label: 'Année', value: 'year' },
          ].map((tab) => {
            const isActive = tab.value === periodMode;
            return (
              <Button
                key={tab.value}
                mode={isActive ? 'contained' : 'outlined'}
                onPress={() => setPeriodMode(tab.value as typeof periodMode)}
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
              {rangeStart ? `Du: ${rangeStart.toLocaleDateString()}` : 'Du: choisir'}
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowEndPicker(true)}
              style={styles.dateButton}
            >
              {rangeEnd ? `Au: ${rangeEnd.toLocaleDateString()}` : 'Au: choisir'}
            </Button>
          </View>
        ) : null}

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
                {[
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
                ].map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
            <View style={styles.periodYearBox}>
              <Text variant="bodySmall" style={styles.periodLabel}>
                Année
              </Text>
              <Picker
                selectedValue={yearValue}
                onValueChange={(value) => setYearValue(String(value))}
                style={styles.periodPickerInput}
                itemStyle={styles.periodPickerItem}
              >
                {Array.from({ length: 5 }).map((_, idx) => {
                  const year = String(now.getFullYear() - idx);
                  return <Picker.Item key={year} label={year} value={year} />;
                })}
              </Picker>
            </View>
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
                {[
                  { label: 'T1', value: '1' },
                  { label: 'T2', value: '2' },
                  { label: 'T3', value: '3' },
                  { label: 'T4', value: '4' },
                ].map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
            <View style={styles.periodYearBox}>
              <Text variant="bodySmall" style={styles.periodLabel}>
                Année
              </Text>
              <Picker
                selectedValue={yearValue}
                onValueChange={(value) => setYearValue(String(value))}
                style={styles.periodPickerInput}
                itemStyle={styles.periodPickerItem}
              >
                {Array.from({ length: 5 }).map((_, idx) => {
                  const year = String(now.getFullYear() - idx);
                  return <Picker.Item key={year} label={year} value={year} />;
                })}
              </Picker>
            </View>
          </View>
        ) : null}

        {periodMode === 'year' ? (
          <View style={styles.periodRow}>
            <View style={styles.periodYearBox}>
              <Text variant="bodySmall" style={styles.periodLabel}>
                Année
              </Text>
              <Picker
                selectedValue={yearValue}
                onValueChange={(value) => setYearValue(String(value))}
                style={styles.periodPickerInput}
                itemStyle={styles.periodPickerItem}
              >
                {Array.from({ length: 5 }).map((_, idx) => {
                  const year = String(now.getFullYear() - idx);
                  return <Picker.Item key={year} label={year} value={year} />;
                })}
              </Picker>
            </View>
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

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Résumé
            </Text>
            <View style={styles.row}>
              <Text variant="bodyMedium">Ventes</Text>
              <Text variant="bodyMedium">{formatCurrency(totalSales)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="bodyMedium">Autres entrées</Text>
              <Text variant="bodyMedium">{formatCurrency(totalOtherIncomes)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="bodyMedium">Revenus totaux</Text>
              <Text variant="bodyMedium">{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="bodyMedium">Achats</Text>
              <Text variant="bodyMedium">{formatCurrency(totalPurchases)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="bodyMedium">Dépenses</Text>
              <Text variant="bodyMedium">{formatCurrency(totalExpenses)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="bodyMedium">Salaires</Text>
              <Text variant="bodyMedium">{formatCurrency(totalSalaries)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="titleSmall" style={styles.bold}>
                Résultat
              </Text>
              <Text variant="titleSmall" style={[styles.bold, { color: theme.colors.primary }]}>
                {formatCurrency(netProfit)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Évaluation actifs / passifs
            </Text>
            <View style={styles.chartWrapper}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barSegment,
                    {
                      flex: Math.max(assetsRatio, 0.01),
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    {
                      flex: Math.max(liabilitiesRatio, 0.01),
                      backgroundColor: theme.colors.error,
                    },
                  ]}
                />
              </View>
              <View style={styles.barLegendRow}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: theme.colors.primary }]}
                  />
                  <Text variant="bodySmall">Actifs: {formatCurrency(assets)}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: theme.colors.error }]}
                  />
                  <Text variant="bodySmall">Passifs: {formatCurrency(liabilities)}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeaderRow}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Flux financiers
              </Text>
              <Button mode="text" compact onPress={() => router.push('/finance/other-incomes')}>
                Autres entrées
              </Button>
            </View>

            {cashFlowList.slice(0, 8).map((item, idx) => {
              const source = item.source || item.category || 'Flux';
              const type = item.type || (Number(item.income) > 0 ? 'INCOME' : 'EXPENSE');
              const amount = Number(item.amount ?? item.income ?? 0) || Number(item.expense ?? 0);
              const signedAmount = type === 'INCOME' ? amount : -Math.abs(amount);
              return (
                <View key={`${item.createdAt || item.date || idx}`} style={styles.row}>
                  <Text variant="bodySmall" style={styles.flowLabel}>
                    {type} - {source}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: signedAmount >= 0 ? theme.colors.primary : theme.colors.error }}
                  >
                    {formatCurrency(Math.abs(signedAmount))}
                  </Text>
                </View>
              );
            })}
            {!cashFlowList.length ? (
              <Text variant="bodySmall" style={styles.flowEmpty}>
                Aucun flux sur la période.
              </Text>
            ) : null}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  bold: {
    fontWeight: 'bold',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  quickTabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
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
    color: '#111827',
  },
  filterPickerItem: {
    height: 36,
    fontSize: 12,
    color: '#111827',
  },
  periodTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  periodTab: {
    minWidth: 90,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  dateButton: {
    flex: 1,
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
  periodYearBox: {
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
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
  },
  barContainer: {
    width: '100%',
    height: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  barLegendRow: {
    marginTop: Spacing.md,
    width: '100%',
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  flowLabel: {
    flex: 1,
    opacity: 0.8,
    marginRight: Spacing.sm,
  },
  flowEmpty: {
    opacity: 0.6,
  },
});
