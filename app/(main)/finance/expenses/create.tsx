import { Spacing } from '@/constants/theme';
import { useCreateExpense } from '@/hooks/useFinance';
import { useAppStore } from '@/stores/app.store';
import type { CreateExpenseRequest } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { StoreContextText } from '@/components/StoreContextText';

export default function CreateExpenseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();
  const createMutation = useCreateExpense();
  const { canManageStore: canManage } = useStoreAccess();

  React.useEffect(() => {
    if (!canManage) {
      router.replace('/finance/expenses');
    }
  }, [canManage, router]);

  const [formData, setFormData] = useState<CreateExpenseRequest>({
    depotId: selectedDepotId || '',
    category: '',
    amount: 0,
    description: '',
    reference: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (selectedDepotId && formData.depotId !== selectedDepotId) {
      setFormData((prev) => ({ ...prev, depotId: selectedDepotId }));
    }
  }, [selectedDepotId, formData.depotId]);

  const handleSubmit = async () => {
    if (!formData.depotId || !formData.category || formData.amount <= 0) {
      setError('Veuillez remplir les champs obligatoires (dépôt, catégorie, montant)');
      return;
    }

    const payload: CreateExpenseRequest = {
      depotId: formData.depotId,
      category: formData.category.trim(),
      amount: Number(formData.amount) || 0,
    };
    if (formData.description?.trim()) payload.description = formData.description.trim();
    if (formData.reference?.trim()) payload.reference = formData.reference.trim();

    try {
      await createMutation.mutateAsync(payload);
      setSuccess('Dépense créée');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/finance/expenses');
        }
      }, 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const errMsg = Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de la création';
      setError(errMsg);
    }
  };

  if (!canManage) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Accès réservé aux administrateurs et gérants." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text variant="headlineSmall" style={styles.title}>
              Nouvelle dépense
            </Text>

            <StoreContextText style={styles.input} />

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
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
              style={styles.submitButton}
            >
              Créer
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>

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
});
