import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDepots } from '@/hooks/useDepots';
import { useUpdateOtherIncome } from '@/hooks/useFinance';
import { otherIncomeService } from '@/services/finance.service';
import type { CreateOtherIncomeRequest } from '@/types';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditOtherIncomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { hasRole } = useAuthContext();
  const canManage = hasRole(['ADMIN', 'GERANT']);
  const updateMutation = useUpdateOtherIncome();
  const { data: depots } = useDepots();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateOtherIncomeRequest>({
    depotId: '',
    category: '',
    amount: 0,
    description: '',
    reference: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await otherIncomeService.getById(id);
        setFormData({
          depotId: data.depotId,
          category: data.category,
          amount: data.amount,
          description: data.description || '',
          reference: data.reference || '',
        });
      } catch (err: any) {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    if (!formData.depotId || !formData.category.trim() || formData.amount <= 0 || !formData.description.trim()) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          depotId: formData.depotId,
          category: formData.category.trim(),
          amount: Number(formData.amount) || 0,
          description: formData.description.trim(),
          reference: formData.reference?.trim() || undefined,
        },
      });
      setSuccess('Entrée modifiée');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/finance/other-incomes');
        }
      }, 1000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur de modification');
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text variant="headlineSmall" style={styles.title}>
              Modifier entrée hors ventes
            </Text>

            <View style={styles.pickerWrapper}>
              <Text variant="bodySmall" style={styles.pickerLabel}>
                Dépôt *
              </Text>
              <Picker
                selectedValue={formData.depotId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, depotId: String(value) }))}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', marginBottom: Spacing.lg },
  input: { marginBottom: Spacing.md },
  pickerWrapper: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  pickerLabel: { marginLeft: Spacing.sm, marginTop: Spacing.xs, opacity: 0.7 },
  picker: { height: 48, color: '#111827' },
  pickerItem: { fontSize: 14, color: '#111827' },
  submitButton: { marginTop: Spacing.md },
});
