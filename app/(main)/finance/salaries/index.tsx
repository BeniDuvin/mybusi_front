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
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSalaries, useDeleteSalary } from '@/hooks/useFinance';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import type { SalaryPayment } from '@/types';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function SalariesListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { hasRole } = useAuthContext();
  const canManage = hasRole(['ADMIN', 'GERANT']);
  const isAdmin = hasRole(['ADMIN']);

  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [period, setPeriod] = useState('');
  const [startDateValue, setStartDateValue] = useState<Date | null>(null);
  const [endDateValue, setEndDateValue] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryPayment | null>(null);

  const { data: usersData } = useUsers(
    { page: 1, limit: 200, isActive: true },
    { enabled: isAdmin }
  );

  const startDate = startDateValue
    ? new Date(
        startDateValue.getFullYear(),
        startDateValue.getMonth(),
        startDateValue.getDate(),
        0,
        0,
        0,
        0
      ).toISOString()
    : undefined;
  const endDate = endDateValue
    ? new Date(
        endDateValue.getFullYear(),
        endDateValue.getMonth(),
        endDateValue.getDate(),
        23,
        59,
        59,
        999
      ).toISOString()
    : undefined;

  const { data, isLoading, error, refetch } = useSalaries({
    page,
    limit: 20,
    userId: userId || undefined,
    period: period.trim() || undefined,
    startDate,
    endDate,
  });
  const deleteMutation = useDeleteSalary();
  const salaries = useMemo(() => data?.data || [], [data?.data]);

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
        {isAdmin ? (
          <View style={styles.filterItem}>
            <Text variant="bodySmall" style={styles.filterLabel}>
              Employé
            </Text>
            <Picker
              selectedValue={userId}
              onValueChange={(value) => {
                setUserId(String(value));
                setPage(1);
              }}
              style={styles.filterPicker}
              itemStyle={styles.filterPickerItem}
            >
              <Picker.Item label="Tous" value="" />
              {usersData?.data?.map((item) => (
                <Picker.Item
                  key={item.id}
                  label={`${item.firstName} ${item.lastName}`}
                  value={item.id}
                />
              ))}
            </Picker>
          </View>
        ) : null}
      </View>

      <View style={styles.filtersRow}>
        <TextInput
          label="Période"
          value={period}
          onChangeText={(value) => {
            setPeriod(value);
            setPage(1);
          }}
          mode="outlined"
          style={styles.periodInput}
        />
      </View>

      <View style={styles.filtersRow}>
        <Button mode="outlined" onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
          {startDateValue ? `Du: ${formatDate(startDateValue)}` : 'Du: choisir'}
        </Button>
        <Button mode="outlined" onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
          {endDateValue ? `Au: ${formatDate(endDateValue)}` : 'Au: choisir'}
        </Button>
      </View>

      <View style={[styles.filtersRow, styles.actionsRow]}>
        <Button
          mode="text"
          onPress={() => {
            setUserId('');
            setPeriod('');
            setStartDateValue(null);
            setEndDateValue(null);
            setPage(1);
          }}
        >
          Réinitialiser
        </Button>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDateValue || new Date()}
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
              setStartDateValue(selectedDate);
              setPage(1);
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDateValue || startDateValue || new Date()}
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
              setEndDateValue(selectedDate);
              setPage(1);
            }
          }}
        />
      )}

      <FlatList
        data={salaries}
        renderItem={renderSalary}
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
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  actionsRow: {
    justifyContent: 'flex-end',
    paddingTop: 0,
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
  periodInput: {
    flex: 1,
  },
  dateButton: {
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
