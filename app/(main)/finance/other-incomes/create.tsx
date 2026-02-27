import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDepots } from '@/hooks/useDepots';
import { useCreateOtherIncome } from '@/hooks/useFinance';
import { useAppStore } from '@/stores/app.store';
import type { CreateOtherIncomeRequest } from '@/types';
import { Picker } from '@react-native-picker/picker';
import { PickerField } from '@/components/ui/PickerField';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateOtherIncomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();
  const canManage = useAuthContext().hasRole(['ADMIN', 'GERANT']);

  React.useEffect(() => {
    if (!canManage) {
      router.replace('/finance/other-incomes');
    }
  }, [canManage, router]);
  const createMutation = useCreateOtherIncome();
  const { data: depots } = useDepots();

  const [formData, setFormData] = useState<CreateOtherIncomeRequest>({
    depotId: selectedDepotId || '',
    category: '',
    amount: 0,
    description: '',
    reference: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!formData.depotId && selectedDepotId) {
      setFormData((prev) => ({ ...prev, depotId: selectedDepotId }));
    }
    if (!formData.depotId && depots?.data?.length && !selectedDepotId) {
      setFormData((prev) => ({ ...prev, depotId: depots.data[0].id }));
    }
  }, [depots?.data, formData.depotId, selectedDepotId]);

  const handleSubmit = async () => {
    if (!formData.depotId || !formData.category.trim() || formData.amount <= 0 || !formData.description.trim()) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      const payload: CreateOtherIncomeRequest = {
        depotId: formData.depotId,
        category: formData.category.trim(),
        amount: Number(formData.amount) || 0,
        description: formData.description.trim(),
        reference: formData.reference?.trim() || undefined,
      };
      await createMutation.mutateAsync(payload);
      setSuccess('Entrée enregistrée');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/finance/other-incomes');
        }
      }, 1000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || "Erreur lors de l'enregistrement");
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text variant="headlineSmall" style={styles.title}>
              Nouvelle entrée hors ventes
            </Text>

            <PickerField
              label="Dépôt *"
              selectedValue={formData.depotId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, depotId: String(value) }))}
            >
              <Picker.Item label="Sélectionner un dépôt" value="" />
              {depots?.data?.map((depot) => (
                <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
              ))}
            </PickerField>

            <TextInput
              label="Rubrique *"
              value={formData.category}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, category: text }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Montant *"
              value={String(formData.amount || '')}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, amount: parseFloat(text) || 0 }))}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Affix text="FCFA" />}
              style={styles.input}
            />
            <TextInput
              label="Description *"
              value={formData.description}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
              mode="outlined"
              multiline
              style={styles.input}
            />
            <TextInput
              label="Référence"
              value={formData.reference || ''}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, reference: text }))}
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
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={2000}>
        {success}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  title: { fontWeight: 'bold', marginBottom: Spacing.lg },
  input: { marginBottom: Spacing.md },
  submitButton: { marginTop: Spacing.md },
});
