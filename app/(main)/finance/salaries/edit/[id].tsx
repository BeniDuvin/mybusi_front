import { Spacing } from '@/constants/theme';
import { useUpdateSalary } from '@/hooks/useFinance';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { salaryService } from '@/services/finance.service';
import type { CreateSalaryRequest } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

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

  const formatPeriodFromDate = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const formatted = new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
          paymentDate: salary.paymentDate || new Date().toISOString().split('T')[0],
          notes: salary.notes || '',
        });
      } catch (err: any) {
        setError(getErrorMessage(err?.response?.data?.message, 'Erreur lors du chargement'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
    setFormData((prev) => ({
      ...prev,
      period: formatPeriodFromDate(prev.paymentDate) || prev.period,
    }));
  }, [formData.paymentDate]);

  const handleSubmit = async () => {
    if (!id) return;
    if (!formData.userId || !formData.period || formData.amount <= 0) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      const payload: Partial<CreateSalaryRequest> = {
        userId: formData.userId,
        amount: Number(formData.amount) || 0,
        period: formatPeriodFromDate(formData.paymentDate),
        paymentDate: new Date(formData.paymentDate).toISOString(),
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

          <TextInput
            label="Période *"
            value={formData.period}
            mode="outlined"
            style={[styles.input, styles.readonlyInput]}
            disabled
          />

          <TextInput
            label="Date de paiement *"
            value={formData.paymentDate}
            onChangeText={(text) => setFormData({ ...formData, paymentDate: text })}
            mode="outlined"
            style={styles.input}
          />

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
  },
  pickerItem: {
    fontSize: 14,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
