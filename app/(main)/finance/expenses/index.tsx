import React, { useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';
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
import { useDepots } from '@/hooks/useDepots';
import { useAppStore } from '@/stores/app.store';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import type { Expense } from '@/types';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { PickerField } from '@/components/ui/PickerField';
import { invoiceService } from '@/services/invoice.service';

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

export default function ExpensesListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();
  const { canManageStore: canManage, isOwner: isAdmin } = useStoreAccess();
  const { data: depots } = useDepots();

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
  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

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

  const { data, isLoading, error, refetch } = useExpenses({
    page,
    limit: 200,
    depotId: selectedDepotId || undefined,
    startDate,
    endDate,
  });
  const deleteMutation = useDeleteExpense();
  const expenses = data?.data || [];

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

  const handlePrint = async () => {
    const depotName = depots?.data?.find((depot) => depot.id === selectedDepotId)?.name || 'Tous';
    const list = [...expenses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const total = list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const rows = list
      .map(
        (item) => `
          <tr>
            <td>${formatDateTime(item.createdAt)}</td>
            <td>${item.category}</td>
            <td>${item.description || '—'}</td>
            <td>${item.reference || '—'}</td>
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
          <h2>Rapport des dépenses</h2>
          <div class="meta">Dépôt: ${depotName}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Référence</th>
                <th style="text-align:right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5">Aucune dépense</td></tr>'}
            </tbody>
          </table>
          <div class="total">Total: ${formatCurrency(total)}</div>
        </body>
      </html>
    `;
    await invoiceService.printHtml(html);
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <Card
      style={styles.card}
      onPress={() => canManage && router.push(`/finance/expenses/edit/${item.id}`)}
    >
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
          {canManage && (
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
              {isAdmin && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    setSelectedExpense(item);
                    setDeleteDialogVisible(true);
                  }}
                  title="Supprimer"
                  leadingIcon="delete"
                />
              )}
            </Menu>
          )}
        </View>
        <Text variant="titleSmall" style={[styles.amount, { color: theme.colors.primary }]}>
          {formatCurrency(item.amount)}
        </Text>
      </Card.Content>
    </Card>
  );

  if (!canManage) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Accès réservé aux administrateurs et gérants." />
      </SafeAreaView>
    );
  }

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
          onValueChange={(value) => {
            setSelectedDepotId(value);
            setPage(1);
          }}
          containerStyle={styles.filterPickerField}
        >
          {depots?.data?.map((depot) => (
            <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
          ))}
        </PickerField>
        <Button mode="contained" onPress={handlePrint} style={styles.printButton}>
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
              onPress={() => {
                setPeriodMode(tab.value);
                setPage(1);
              }}
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
          <Button mode="outlined" onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
            {rangeStart ? `Du: ${formatDate(rangeStart)}` : 'Du: choisir'}
          </Button>
          <Button mode="outlined" onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
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
              setPage(1);
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
              setPage(1);
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
              onValueChange={(value) => {
                setMonthValue(String(value));
                setPage(1);
              }}
              style={styles.periodPickerInput}
              itemStyle={styles.periodPickerItem}
            >
              {MONTH_OPTIONS.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
          <View style={styles.periodPicker}>
            <Text variant="bodySmall" style={styles.periodLabel}>
              Année
            </Text>
            <Picker
              selectedValue={yearValue}
              onValueChange={(value) => {
                setYearValue(String(value));
                setPage(1);
              }}
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
              onValueChange={(value) => {
                setQuarterValue(String(value));
                setPage(1);
              }}
              style={styles.periodPickerInput}
              itemStyle={styles.periodPickerItem}
            >
              {QUARTER_OPTIONS.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
          <View style={styles.periodPicker}>
            <Text variant="bodySmall" style={styles.periodLabel}>
              Année
            </Text>
            <Picker
              selectedValue={yearValue}
              onValueChange={(value) => {
                setYearValue(String(value));
                setPage(1);
              }}
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
          <View style={styles.periodPicker}>
            <Text variant="bodySmall" style={styles.periodLabel}>
              Année
            </Text>
            <Picker
              selectedValue={yearValue}
              onValueChange={(value) => {
                setYearValue(String(value));
                setPage(1);
              }}
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

      <FlatList
        data={expenses}
        renderItem={renderExpense}
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
              icon="tray"
              title="Aucune dépense"
              message={canManage ? 'Ajoutez votre première dépense' : 'Aucune dépense enregistrée'}
              actionLabel={canManage ? 'Nouvelle dépense' : undefined}
              onAction={canManage ? () => router.push('/finance/expenses/create') : undefined}
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

      {canManage && (
        <FAB
          icon="plus"
          label="Nouvelle dépense"
          style={styles.fab}
          onPress={() => router.push('/finance/expenses/create')}
        />
      )}

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
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
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
