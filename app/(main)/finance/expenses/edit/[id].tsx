import { Spacing } from '@/constants/theme';
import { useUpdateExpense } from '@/hooks/useFinance';
import { useAuthContext } from '@/contexts/AuthContext';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { expenseService } from '@/services/finance.service';
import type { CreateExpenseRequest } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditExpenseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const updateMutation = useUpdateExpense();
  const { hasRole } = useAuthContext();
  const canManage = hasRole(['ADMIN', 'GERANT']);

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    depotId: '',
    category: '',
    amount: 0,
    description: '',
    reference: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        const expense = await expenseService.getById(id);
        setFormData({
          depotId: expense.depotId,
          category: expense.category,
          amount: expense.amount,
          description: expense.description || '',
          reference: expense.reference || '',
        });
      } catch (err: any) {
        setError(getErrorMessage(err?.response?.data?.message, 'Erreur lors du chargement'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    if (!formData.category || formData.amount <= 0) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      const payload = {
        category: formData.category.trim(),
        amount: Number(formData.amount) || 0,
        description: formData.description?.trim() || undefined,
        reference: formData.reference?.trim() || undefined,
      };
      await updateMutation.mutateAsync({ id, data: payload });
      setSuccess('Dépense mise à jour');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/finance/expenses');
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
            Modifier la dépense
          </Text>

          <TextInput
            label="Catégorie *"
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
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
            label="Description"
            value={formData.description || ''}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Référence"
            value={formData.reference || ''}
            onChangeText={(text) => setFormData({ ...formData, reference: text })}
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
  submitButton: {
    marginTop: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
