import { Spacing } from '@/constants/theme';
import { useDepots } from '@/hooks/useDepots';
import { useBrands, useCategories, useCreateProduct } from '@/hooks/useProducts';
import type { CreateProductRequest } from '@/types';
import { Picker } from '@react-native-picker/picker';
import { PickerField } from '@/components/ui/PickerField';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Snackbar,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    imageUrl: '',
    categoryId: '',
    brandId: '',
    depotId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    minStock: 10,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateSku = (name: string) => {
    const base = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 12);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return base ? `${base}-${suffix}` : `SKU-${suffix}`;
  };

  const generateBarcode = () => {
    const raw = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return raw.slice(-13);
  };

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  const getAssetSizeBytes = (asset: ImagePicker.ImagePickerAsset) => {
    if (typeof asset.fileSize === 'number') return asset.fileSize;
    if (!asset.base64) return 0;
    return Math.floor((asset.base64.length * 3) / 4);
  };

  const getImageMediaTypes = () => {
    const picker = ImagePicker as unknown as {
      MediaType?: { Images?: string; Image?: string };
      MediaTypeOptions?: { Images?: string };
    };
    if (picker.MediaType?.Images) return [picker.MediaType.Images];
    if (picker.MediaType?.Image) return [picker.MediaType.Image];
    if (picker.MediaTypeOptions?.Images) return picker.MediaTypeOptions.Images;
    return undefined;
  };

  const buildImageDataUrl = (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) return '';
    const mimeType = asset.mimeType || 'image/jpeg';
    return `data:${mimeType};base64,${asset.base64}`;
  };

  useEffect(() => {
    if (formData.name && !formData.sku) {
      setFormData((prev) => ({ ...prev, sku: generateSku(prev.name) }));
    }
    if (!formData.barcode) {
      setFormData((prev) => ({ ...prev, barcode: generateBarcode() }));
    }
  }, [formData.name]);

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Permission galerie refusée");
        return;
      }

      const mediaTypes = getImageMediaTypes();
      const result = await ImagePicker.launchImageLibraryAsync({
        ...(mediaTypes ? { mediaTypes } : {}),
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) {
        setError("Impossible de récupérer l'image sélectionnée");
        return;
      }
      const sizeBytes = getAssetSizeBytes(asset);
      if (sizeBytes > MAX_IMAGE_BYTES) {
        setError("Image trop lourde (max 5 Mo)");
        return;
      }
      const dataUrl = buildImageDataUrl(asset);
      if (!dataUrl) {
        setError("Impossible de convertir l'image sélectionnée");
        return;
      }
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message ? `Erreur lors de la sélection: ${message}` : "Erreur lors de la sélection de l'image");
    }
  };

  const handlePickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Permission caméra refusée");
        return;
      }

      const mediaTypes = getImageMediaTypes();
      const result = await ImagePicker.launchCameraAsync({
        ...(mediaTypes ? { mediaTypes } : {}),
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) {
        setError("Impossible de récupérer la photo");
        return;
      }
      const sizeBytes = getAssetSizeBytes(asset);
      if (sizeBytes > MAX_IMAGE_BYTES) {
        setError("Image trop lourde (max 5 Mo)");
        return;
      }
      const dataUrl = buildImageDataUrl(asset);
      if (!dataUrl) {
        setError("Impossible de convertir la photo");
        return;
      }
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message ? `Erreur lors de la prise: ${message}` : "Erreur lors de la prise de photo");
    }
  };

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
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/products');
        }
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
            label="Code SKU (auto)"
            value={formData.sku}
            mode="outlined"
            editable={false}
            style={[styles.input, styles.readonlyInput]}
          />

          <TextInput
            label="Code-barres (auto)"
            value={formData.barcode}
            mode="outlined"
            editable={false}
            style={[styles.input, styles.readonlyInput]}
          />

          <View style={styles.imageSection}>
            <Text variant="bodyMedium" style={styles.sectionLabel}>
              Image du produit (optionnel)
            </Text>
            {formData.imageUrl ? (
              <View style={styles.imagePreviewWrapper}>
                <Image source={{ uri: formData.imageUrl }} style={styles.imagePreview} />
                <Button mode="text" onPress={() => setFormData({ ...formData, imageUrl: '' })}>
                  Retirer l'image
                </Button>
              </View>
            ) : null}
            <View style={styles.imageActions}>
            <Button mode="outlined" onPress={handlePickFromGallery} icon="image">
              Galerie
            </Button>
            <Button mode="outlined" onPress={handlePickFromCamera} icon="camera">
              Caméra
            </Button>
            </View>
            <TextInput
              label="URL de l'image"
              value={formData.imageUrl || ''}
              onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
              mode="outlined"
              style={styles.input}
              placeholder="https://..."
              autoCapitalize="none"
            />
          </View>

          <PickerField
            label="Catégorie *"
            selectedValue={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <Picker.Item label="Sélectionner une catégorie" value="" />
            {categories?.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </PickerField>

          <PickerField
            label="Marque *"
            selectedValue={formData.brandId}
            onValueChange={(value) => setFormData({ ...formData, brandId: value })}
          >
            <Picker.Item label="Sélectionner une marque" value="" />
            {brands?.map((brand) => (
              <Picker.Item key={brand.id} label={brand.name} value={brand.id} />
            ))}
          </PickerField>

          <PickerField
            label="Dépôt *"
            selectedValue={formData.depotId}
            onValueChange={(value) => setFormData({ ...formData, depotId: value })}
          >
            <Picker.Item label="Sélectionner un dépôt" value="" />
            {depots?.data?.map((depot) => (
              <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
            ))}
          </PickerField>

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
            <Button
              mode="outlined"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/products');
                }
              }}
              style={styles.cancelButton}
            >
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
  readonlyInput: {
    opacity: 0.7,
  },
  imageSection: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  imagePreviewWrapper: {
    marginBottom: Spacing.sm,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: Spacing.xs,
    backgroundColor: '#EEE',
  },
  imageActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
