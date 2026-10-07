import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useDepots } from '@/hooks/useDepots';
import { useDeleteOtherIncome, useOtherIncomes } from '@/hooks/useFinance';
import { invoiceService } from '@/services/invoice.service';
import { useAppStore } from '@/stores/app.store';
import type { OtherIncome } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { PickerField } from '@/components/ui/PickerField';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, FAB, IconButton, Menu, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OtherIncomesListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();
  const { canManageStore: canManage, isOwner: isAdmin } = useStoreAccess();
  const { data: depots } = useDepots();
  const deleteMutation = useDeleteOtherIncome();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [category, setCategory] = useState('');
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OtherIncome | null>(null);

  const startDate = rangeStart
    ? new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), 0, 0, 0, 0).toISOString()
    : undefined;
  const endDate = rangeEnd
    ? new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59, 999).toISOString()
    : undefined;

  const { data, isLoading, error, refetch } = useOtherIncomes({
    page,
    limit,
    depotId: selectedDepotId || undefined,
    category: category.trim() || undefined,
    startDate,
    endDate,
  });

  const list = useMemo(() => data?.data || [], [data?.data]);

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteMutation.mutateAsync(selectedItem.id);
      setDeleteDialogVisible(false);
      setSelectedItem(null);
      refetch();
    } catch (err) {
      console.error('Delete other-income error:', err);
    }
  };

  const handlePrint = async () => {
    const depotName = depots?.data?.find((d) => d.id === selectedDepotId)?.name || 'Tous';
    const rows = list
      .map(
        (item) => `
          <tr>
            <td>${formatDateTime(item.createdAt)}</td>
            <td>${item.category}</td>
            <td>${item.description || '—'}</td>
            <td>${item.reference || '—'}</td>
            <td>${item.depot?.name || '—'}</td>
            <td>${item.user ? `${item.user.firstName} ${item.user.lastName}` : '—'}</td>
            <td style="text-align:right;">${formatCurrency(item.amount)}</td>
          </tr>
        `
      )
      .join('');
    const total = list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const html = `
      <html><head><meta charset="utf-8"/><style>
      body{font-family:Arial,sans-serif;padding:16px;} table{width:100%;border-collapse:collapse;}
      th,td{border-bottom:1px solid #eee;padding:8px;font-size:12px;} th{background:#f7f7f7;text-align:left;}
      .meta{color:#666;margin-bottom:16px;} .total{font-weight:bold;text-align:right;margin-top:12px;}
      </style></head><body>
      <h2>Rapport des autres entrées</h2>
      <div class="meta">Dépôt: ${depotName} · Catégorie: ${category || 'Toutes'} · Dates: ${rangeStart ? formatDate(rangeStart) : '—'} à ${rangeEnd ? formatDate(rangeEnd) : '—'}</div>
      <table><thead><tr>
      <th>Date</th><th>Rubrique</th><th>Description</th><th>Référence</th><th>Dépôt</th><th>Utilisateur</th><th style="text-align:right;">Montant</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="7">Aucune entrée</td></tr>'}</tbody></table>
      <div class="total">Total: ${formatCurrency(total)}</div>
      </body></html>
    `;
    await invoiceService.printHtml(html);
  };

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
        <View style={styles.filterItem}>
          <TextInput
            label="Rubrique"
            value={category}
            onChangeText={(value) => {
              setCategory(value);
              setPage(1);
            }}
            mode="outlined"
          />
        </View>
      </View>

      <View style={styles.filtersRow}>
        <Button mode="outlined" onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
          {rangeStart ? `Du: ${formatDate(rangeStart)}` : 'Du: choisir'}
        </Button>
        <Button mode="outlined" onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
          {rangeEnd ? `Au: ${formatDate(rangeEnd)}` : 'Au: choisir'}
        </Button>
      </View>

      <View style={[styles.filtersRow, styles.actionsRow]}>
        <Button mode="contained" onPress={handlePrint}>
          Imprimer
        </Button>
        <Button
          mode="text"
          onPress={() => {
            setCategory('');
            setRangeStart(null);
            setRangeEnd(null);
            setPage(1);
          }}
        >
          Réinitialiser
        </Button>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={rangeStart || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (Platform.OS !== 'ios') setShowStartPicker(false);
            if (event.type === 'dismissed') return;
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
            if (Platform.OS !== 'ios') setShowEndPicker(false);
            if (event.type === 'dismissed') return;
            if (selectedDate) {
              setRangeEnd(selectedDate);
              setPage(1);
            }
          }}
        />
      )}

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => canManage && router.push({ pathname: '/finance/other-incomes/edit/[id]', params: { id: item.id } })}
          >
            <Card.Content>
              <View style={styles.header}>
                <View style={styles.info}>
                  <Text variant="titleMedium" style={styles.name}>
                    {item.category}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    {item.description}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    Ref: {item.reference || '—'} · Dépôt: {item.depot?.name || '—'}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    Utilisateur: {item.user ? `${item.user.firstName} ${item.user.lastName}` : '—'}
                  </Text>
                </View>
                {canManage && (
                  <Menu
                    visible={menuVisible === item.id}
                    onDismiss={() => setMenuVisible(null)}
                    anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(item.id)} />}
                  >
                    <Menu.Item
                      title="Modifier"
                      leadingIcon="pencil"
                      onPress={() => {
                        setMenuVisible(null);
                        router.push({ pathname: '/finance/other-incomes/edit/[id]', params: { id: item.id } });
                      }}
                    />
                    {isAdmin && (
                      <Menu.Item
                        title="Supprimer"
                        leadingIcon="delete"
                        onPress={() => {
                          setMenuVisible(null);
                          setSelectedItem(item);
                          setDeleteDialogVisible(true);
                        }}
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
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="cash-plus"
              title="Aucune entrée"
              message={canManage ? 'Ajoutez votre première entrée hors ventes' : 'Aucune entrée enregistrée'}
              actionLabel={canManage ? 'Nouvelle entrée' : undefined}
              onAction={canManage ? () => router.push('/finance/other-incomes/create') : undefined}
            />
          ) : null
        }
        onEndReached={() => {
          if (data?.meta && page < data.meta.totalPages) {
            setPage((prev) => prev + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />

      {canManage && (
        <FAB icon="plus" label="Nouvelle entrée" style={styles.fab} onPress={() => router.push('/finance/other-incomes/create')} />
      )}

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>Supprimer cette entrée ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleDelete} loading={deleteMutation.isPending} textColor={theme.colors.error}>
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  actionsRow: { justifyContent: 'space-between', alignItems: 'center' },
  filterItem: { flex: 1 },
  filterLabel: { marginLeft: Spacing.xs, opacity: 0.7 },
  filterPickerField: { flex: 1, marginBottom: 0 },
  dateButton: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: 100 },
  card: { marginBottom: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { flex: 1 },
  name: { fontWeight: 'bold' },
  meta: { opacity: 0.7, marginTop: Spacing.xs },
  amount: { marginTop: Spacing.sm, fontWeight: 'bold' },
  fab: { position: 'absolute', right: Spacing.md, bottom: Spacing.md },
});
