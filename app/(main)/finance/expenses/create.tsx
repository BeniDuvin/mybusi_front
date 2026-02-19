import { Spacing } from '@/constants/theme';
import { useCreateExpense } from '@/hooks/useFinance';
import { useDepots } from '@/hooks/useDepots';
import { useAppStore } from '@/stores/app.store';
import type { CreateExpenseRequest } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function CreateExpenseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();
  const createMutation = useCreateExpense();
  const canEdit = useAuthContext().hasRole(['ADMIN']);

  React.useEffect(() => {
    if (!canEdit) {
      router.replace('/finance/expenses');
    }
  }, [canEdit, router]);
  const { data: depots } = useDepots();

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
    if (!formData.depotId && selectedDepotId) {
      setFormData((prev) => ({ ...prev, depotId: selectedDepotId }));
    }
    if (!formData.depotId && depots?.data?.length && !selectedDepotId) {
      setFormData((prev) => ({ ...prev, depotId: depots.data[0].id }));
    }
  }, [selectedDepotId, depots?.data]);

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

  if (!canEdit) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Accès réservé aux administrateurs." />
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

            <View style={styles.pickerWrapper}>
              <Text variant="bodySmall" style={styles.pickerLabel}>
                Dépôt *
              </Text>
              <Picker
                selectedValue={formData.depotId}
                onValueChange={(value) => setFormData({ ...formData, depotId: value || '' })}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Sélectionner un dépôt" value="" />
                {depots?.data?.map((depot) => (
                  <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
                ))}
              </Picker>
            </View>

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
  pickerWrapper: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  pickerLabel: {
    marginLeft: Spacing.sm,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  picker: {
    height: 48,
    color: '#111827',
  },
  pickerItem: {
    fontSize: 14,
    color: '#111827',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
