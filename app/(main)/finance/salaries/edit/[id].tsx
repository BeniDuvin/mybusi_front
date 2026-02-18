import { Spacing } from '@/constants/theme';
import { useUpdateSalary } from '@/hooks/useFinance';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { salaryService } from '@/services/finance.service';
import type { CreateSalaryRequest } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

const MONTH_OPTIONS = [
  { label: 'Janvier', value: 'Janvier' },
  { label: 'Février', value: 'Février' },
  { label: 'Mars', value: 'Mars' },
  { label: 'Avril', value: 'Avril' },
  { label: 'Mai', value: 'Mai' },
  { label: 'Juin', value: 'Juin' },
  { label: 'Juillet', value: 'Juillet' },
  { label: 'Août', value: 'Août' },
  { label: 'Septembre', value: 'Septembre' },
  { label: 'Octobre', value: 'Octobre' },
  { label: 'Novembre', value: 'Novembre' },
  { label: 'Décembre', value: 'Décembre' },
];

export default function EditSalaryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const updateMutation = useUpdateSalary();
  const { user, hasRole } = useAuthContext();
  const isAdmin = hasRole(['ADMIN']);
  const canManage = hasRole(['ADMIN', 'GERANT']);
  const { data: usersData } = useUsers(
    { page: 1, limit: 200, isActive: true },
    { enabled: isAdmin }
  );

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateSalaryRequest>({
    userId: '',
    amount: 0,
    period: '',
    paymentDate: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const today = new Date();
  const defaultMonthLabel = MONTH_OPTIONS[today.getMonth()]?.value || 'Janvier';
  const [periodMonth, setPeriodMonth] = useState(defaultMonthLabel);
  const [periodYear, setPeriodYear] = useState(String(today.getFullYear()));

  const formatPeriodFromDate = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const monthLabel = MONTH_OPTIONS[date.getMonth()]?.value || '';
    return monthLabel ? `${monthLabel} ${date.getFullYear()}` : '';
  };

  const normalizeDateInput = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  const toIsoFromInputDate = (dateValue: string) => {
    const parts = dateValue.split('-').map((part) => Number(part));
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
      return null;
    }
    const [year, month, day] = parts;
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
  };

  const getErrorMessage = (value: unknown, fallback: string) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).join(', ');
    }
    if (typeof value === 'string') {
      return value;
    }
    return fallback;
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const salary = await salaryService.getById(id);
        setFormData({
          userId: salary.userId,
          amount: salary.amount,
          period: formatPeriodFromDate(salary.paymentDate) || salary.period,
          paymentDate: normalizeDateInput(salary.paymentDate) || new Date().toISOString().split('T')[0],
          notes: salary.notes || '',
        });
        const loadedDate = new Date(salary.paymentDate || new Date().toISOString());
        if (!Number.isNaN(loadedDate.getTime())) {
          setPeriodMonth(MONTH_OPTIONS[loadedDate.getMonth()]?.value || defaultMonthLabel);
          setPeriodYear(String(loadedDate.getFullYear()));
        }
      } catch (err: any) {
        setError(getErrorMessage(err?.response?.data?.message, 'Erreur lors du chargement'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [defaultMonthLabel, id]);

  useEffect(() => {
    if (!canManage) return;
    if (!formData.userId && user?.id && !isAdmin) {
      setFormData((prev) => ({ ...prev, userId: user.id }));
    }
    if (isAdmin && !formData.userId && usersData?.data?.length) {
      setFormData((prev) => ({ ...prev, userId: usersData.data[0].id }));
    }
  }, [canManage, formData.userId, isAdmin, user?.id, usersData?.data]);

  useEffect(() => {
    const period = `${periodMonth} ${periodYear}`;
    setFormData((prev) => (prev.period === period ? prev : { ...prev, period }));
  }, [periodMonth, periodYear]);

  const handleSubmit = async () => {
    if (!id) return;
    if (!formData.period || formData.amount <= 0) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      const paymentDateIso = toIsoFromInputDate(formData.paymentDate);
      if (!paymentDateIso) {
        setError('Date de paiement invalide');
        return;
      }
      const payload: Partial<Omit<CreateSalaryRequest, 'userId'>> = {
        amount: Number(formData.amount) || 0,
        period: formData.period.trim(),
        paymentDate: paymentDateIso,
        notes: formData.notes?.trim() || undefined,
      };
      await updateMutation.mutateAsync({ id, data: payload });
      setSuccess('Salaire mis à jour');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/finance/salaries');
        }
      }, 1200);
    } catch (err: any) {
      setError(getErrorMessage(err?.response?.data?.message, 'Erreur lors de la mise à jour'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!canManage ? (
        <ErrorMessage message="Accès réservé aux administrateurs et gérants." />
      ) : (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Modifier le salaire
          </Text>

          {isAdmin ? (
            <Picker
              selectedValue={formData.userId}
              onValueChange={(value) => setFormData({ ...formData, userId: String(value) })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Sélectionner un employé" value="" />
              {usersData?.data?.map((item) => (
                <Picker.Item
                  key={item.id}
                  label={`${item.firstName} ${item.lastName}`}
                  value={item.id}
                />
              ))}
            </Picker>
          ) : (
            <TextInput
              label="Employé"
              value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
              mode="outlined"
              style={[styles.input, styles.readonlyInput]}
              disabled
            />
          )}

          <View style={styles.periodRow}>
            <View style={styles.periodPicker}>
              <Text variant="bodySmall" style={styles.periodLabel}>
                Mois *
              </Text>
              <Picker
                selectedValue={periodMonth}
                onValueChange={(value) => setPeriodMonth(String(value))}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {MONTH_OPTIONS.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
            <View style={styles.periodPicker}>
              <Text variant="bodySmall" style={styles.periodLabel}>
                Année *
              </Text>
              <Picker
                selectedValue={periodYear}
                onValueChange={(value) => setPeriodYear(String(value))}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {Array.from({ length: 6 }).map((_, idx) => {
                  const year = String(today.getFullYear() - 2 + idx);
                  return <Picker.Item key={year} label={year} value={year} />;
                })}
              </Picker>
            </View>
          </View>

          <TextInput
            label="Date de paiement *"
            value={formData.paymentDate}
            mode="outlined"
            style={[styles.input, styles.readonlyInput]}
            disabled
          />
          <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            Choisir la date de paiement
          </Button>

          {showDatePicker && (
            <DateTimePicker
              value={formData.paymentDate ? new Date(formData.paymentDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                if (Platform.OS !== 'ios') {
                  setShowDatePicker(false);
                }
                if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                  return;
                }
                if (selectedDate) {
                  const nextDate = selectedDate.toISOString().slice(0, 10);
                  setFormData((prev) => ({ ...prev, paymentDate: nextDate }));
                }
              }}
            />
          )}

          <TextInput
            label="Montant *"
            value={formData.amount.toString()}
            onChangeText={(text) => setFormData({ ...formData, amount: parseFloat(text) || 0 })}
            mode="outlined"
            keyboardType="numeric"
            left={<TextInput.Affix text="FCFA" />}
            style={styles.input}
          />

          <TextInput
            label="Notes"
            value={formData.notes || ''}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            style={styles.submitButton}
          >
            Enregistrer
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={3000}>
        {success}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.md,
  },
  readonlyInput: {
    opacity: 0.7,
  },
  picker: {
    marginBottom: Spacing.md,
    color: '#111827',
  },
  pickerItem: {
    fontSize: 14,
    color: '#111827',
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
  submitButton: {
    marginTop: Spacing.md,
  },
  dateButton: {
    marginBottom: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
