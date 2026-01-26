import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  useTheme,
  Snackbar,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCreateProduct, useCategories, useBrands } from '@/hooks/useProducts';
import { useDepots } from '@/hooks/useDepots';
import { Spacing } from '@/constants/theme';
import { Picker } from '@react-native-picker/picker';
import type { CreateProductRequest } from '@/types';

export default function CreateProductScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: depots } = useDepots();
  const createMutation = useCreateProduct();

  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    depotId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    minStock: 10,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.sku || !formData.categoryId || !formData.brandId || !formData.depotId) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.purchasePrice <= 0 || formData.sellingPrice <= 0) {
      setError('Les prix doivent être positifs');
      return;
    }

    if (formData.sellingPrice < formData.purchasePrice) {
      setError('Le prix de vente doit être supérieur au prix d\'achat');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setSuccess('Produit créé avec succès');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Nouveau produit
          </Text>

          <TextInput
            label="Nom du produit *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Code SKU *"
            value={formData.sku}
            onChangeText={(text) => setFormData({ ...formData, sku: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Code-barres"
            value={formData.barcode}
            onChangeText={(text) => setFormData({ ...formData, barcode: text })}
            mode="outlined"
            style={styles.input}
          />

          <View style={styles.pickerContainer}>
            <Text variant="bodyMedium" style={styles.pickerLabel}>
              Catégorie *
            </Text>
            <Picker
              selectedValue={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner une catégorie" value="" />
              {categories?.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text variant="bodyMedium" style={styles.pickerLabel}>
              Marque *
            </Text>
            <Picker
              selectedValue={formData.brandId}
              onValueChange={(value) => setFormData({ ...formData, brandId: value })}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner une marque" value="" />
              {brands?.map((brand) => (
                <Picker.Item key={brand.id} label={brand.name} value={brand.id} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text variant="bodyMedium" style={styles.pickerLabel}>
              Dépôt *
            </Text>
            <Picker
              selectedValue={formData.depotId}
              onValueChange={(value) => setFormData({ ...formData, depotId: value })}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un dépôt" value="" />
              {depots?.data?.map((depot) => (
                <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
              ))}
            </Picker>
          </View>

          <TextInput
            label="Prix d'achat *"
            value={formData.purchasePrice.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, purchasePrice: parseFloat(text) || 0 })
            }
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            left={<TextInput.Affix text="FCFA" />}
          />

          <TextInput
            label="Prix de vente *"
            value={formData.sellingPrice.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, sellingPrice: parseFloat(text) || 0 })
            }
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            left={<TextInput.Affix text="FCFA" />}
          />

          <TextInput
            label="Stock minimum *"
            value={formData.minStock.toString()}
            onChangeText={(text) => setFormData({ ...formData, minStock: parseInt(text) || 0 })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton}>
              Annuler
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
              style={styles.submitButton}
            >
              Créer
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setError(''),
        }}
      >
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
  pickerContainer: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
  },
  pickerLabel: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    opacity: 0.6,
  },
  picker: {
    marginHorizontal: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  submitButton: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
});
