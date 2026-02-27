import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDepots } from '@/hooks/useDepots';
import { useBrands, useCategories, useProduct, useUpdateProduct } from '@/hooks/useProducts';
import type { CreateProductRequest } from '@/types';
import { Picker } from '@react-native-picker/picker';
import { PickerField } from '@/components/ui/PickerField';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Divider,
    Snackbar,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProductScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasRole } = useAuthContext();
  const canEdit = hasRole(['ADMIN', 'GERANT']);

  const { data: product, isLoading: isProductLoading } = useProduct(id || '');
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: depots } = useDepots();
  const updateMutation = useUpdateProduct();

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
    if (!product) return;
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId,
      brandId: product.brandId,
      depotId: product.depotId,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      minStock: product.minStock,
    });
  }, [product]);

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
    if (!id) return;

    if (!formData.name || !formData.sku || !formData.categoryId || !formData.brandId) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.purchasePrice <= 0 || formData.sellingPrice <= 0) {
      setError('Les prix doivent être positifs');
      return;
    }

    if (formData.sellingPrice < formData.purchasePrice) {
      setError("Le prix de vente doit être supérieur au prix d'achat");
      return;
    }

    const { depotId, ...updateData } = formData;
    try {
      await updateMutation.mutateAsync({ id, data: updateData });
      setSuccess('Produit mis à jour');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/products');
        }
      }, 1200);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      const details = status ? ` (code ${status})` : '';
      setError(serverMessage ? `${serverMessage}${details}` : `Erreur lors de la mise à jour${details}`);
    }
  };

  if (isProductLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!canEdit) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Accès interdit: vous n'avez pas les permissions pour modifier un produit." />
      </SafeAreaView>
    );
  }

  const depotDisplay = product?.depot?.name || product?.depotId || '';
  const stock =
    product?.quantity ??
    product?.currentStock ??
    product?.stockQuantity ??
    product?.stock?.quantity ??
    0;
  const isLowStock = product ? stock <= product.minStock : false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Modifier le produit
          </Text>

          {product && (
            <Card style={styles.summaryCard}>
              <Card.Content>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.summaryImage} />
                ) : null}
                <View style={styles.summaryHeader}>
                  <Text variant="titleMedium" style={styles.summaryTitle}>
                    {product.name}
                  </Text>
                  <Chip
                    icon={product.isActive ? 'check-circle' : 'close-circle'}
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: product.isActive
                          ? theme.colors.primary
                          : theme.colors.error,
                      },
                    ]}
                    textStyle={styles.statusText}
                  >
                    {product.isActive ? 'Actif' : 'Inactif'}
                  </Chip>
                </View>

                <Text variant="bodySmall" style={styles.summaryMeta}>
                  SKU: {product.sku} {product.barcode ? `• Code-barres: ${product.barcode}` : ''}
                </Text>

                <View style={styles.summaryRow}>
                  <Chip style={styles.metaChip} icon="tag">
                    {product.category?.name || 'Sans catégorie'}
                  </Chip>
                  <Chip style={styles.metaChip} icon="tag-outline">
                    {product.brand?.name || 'Sans marque'}
                  </Chip>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      Stock
                    </Text>
                    <Text
                      variant="titleSmall"
                      style={[styles.summaryValue, isLowStock && { color: theme.colors.error }]}
                    >
                      {stock} (Seuil: {product.minStock})
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      Achat
                    </Text>
                    <Text variant="titleSmall" style={styles.summaryValue}>
                      {product.purchasePrice} FCFA
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      Vente
                    </Text>
                    <Text
                      variant="titleSmall"
                      style={[styles.summaryValue, { color: theme.colors.primary }]}
                    >
                      {product.sellingPrice} FCFA
                    </Text>
                  </View>
                </View>

                <Text variant="bodySmall" style={styles.summaryMeta}>
                  Dépôt: {depotDisplay}
                </Text>
              </Card.Content>
            </Card>
          )}

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

          <TextInput
            label="Dépôt (non modifiable)"
            value={depotDisplay}
            mode="outlined"
            editable={false}
            style={styles.input}
          />

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
              loading={updateMutation.isPending}
              disabled={updateMutation.isPending}
              style={styles.submitButton}
            >
              Enregistrer
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
  summaryCard: {
    marginBottom: Spacing.lg,
    borderRadius: 16,
  },
  summaryImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    backgroundColor: '#EEE',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: Spacing.sm,
  },
  summaryMeta: {
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
    minWidth: 120,
  },
  summaryLabel: {
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  metaChip: {
    marginRight: Spacing.xs,
  },
  divider: {
    marginVertical: Spacing.sm,
  },
  statusChip: {
    borderRadius: 999,
  },
  statusText: {
    color: '#fff',
  },
  input: {
    marginBottom: Spacing.md,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
