import { Spacing } from '@/constants/theme';
import { useDepots } from '@/hooks/useDepots';
import { useProducts } from '@/hooks/useProducts';
import { useCreatePurchase, usePayPurchase, useSuppliers } from '@/hooks/usePurchases';
import { useAppStore } from '@/stores/app.store';
import type { CreatePurchaseRequest } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type PackagingType = 'UNITE' | 'CASIER' | 'CARTON' | 'PAQUET' | 'AUTRE';
type LineInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  packageType: PackagingType;
  packageLabel?: string;
  packageSize: number;
  packageQuantity: number;
  packagePrice: number;
};

export default function CreatePurchaseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createMutation = useCreatePurchase();
  const payMutation = usePayPurchase();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();

  const [depotId, setDepotId] = useState(selectedDepotId || '');
  const [supplierId, setSupplierId] = useState('');
  const [deliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineInput[]>([]);
  const [confirmPayVisible, setConfirmPayVisible] = useState(false);

  const [lineProductId, setLineProductId] = useState('');
  const [linePackageType, setLinePackageType] = useState<PackagingType>('UNITE');
  const [linePackageLabel, setLinePackageLabel] = useState('');
  const [linePackageSize, setLinePackageSize] = useState('1');
  const [linePackageQuantity, setLinePackageQuantity] = useState('1');
  const [linePackagePrice, setLinePackagePrice] = useState('0');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts(
    { limit: 100, depotId: depotId || undefined },
    { refetchInterval: 15000, refetchOnWindowFocus: true }
  );
  const { data: depots } = useDepots();

  const getStock = (productId: string) => {
    const product = products?.data?.find((p) => p.id === productId);
    const stockFromProduct = depotId
      ? product?.stocks?.find((stock) => stock.depotId === depotId)?.quantity
      : product?.stocks?.[0]?.quantity;
    return (
      stockFromProduct ??
      product?.quantity ??
      product?.currentStock ??
      product?.stockQuantity ??
      product?.stock?.quantity ??
      0
    );
  };

  const getPurchaseTotal = () => total;

  const selectedProduct = useMemo(
    () => products?.data?.find((product) => product.id === lineProductId),
    [products?.data, lineProductId]
  );

  React.useEffect(() => {
    if (!depotId && selectedDepotId) {
      setDepotId(selectedDepotId);
    }
  }, [selectedDepotId, depotId]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [lines]
  );

  const previewUnitPrice = useMemo(() => {
    const packSize =
      linePackageType === 'UNITE' ? 1 : parseInt(linePackageSize) || 0;
    const packPrice = parseFloat(linePackagePrice) || 0;
    if (packSize <= 0 || packPrice <= 0) return 0;
    return packPrice / packSize;
  }, [linePackagePrice, linePackageSize, linePackageType]);

  const getPackageLabel = (type: PackagingType) => {
    switch (type) {
      case 'UNITE':
        return 'Unité';
      case 'CASIER':
        return 'Casier';
      case 'CARTON':
        return 'Carton';
      case 'PAQUET':
        return 'Paquet';
      default:
        return 'Autre';
    }
  };

  const handleAddLine = () => {
    if (!lineProductId) {
      setError('Sélectionnez un produit');
      return;
    }
    const packageQuantity = parseInt(linePackageQuantity) || 0;
    const packageSize =
      linePackageType === 'UNITE' ? 1 : parseInt(linePackageSize) || 0;
    const packagePrice = parseFloat(linePackagePrice) || 0;
    if (linePackageType === 'AUTRE' && !linePackageLabel.trim()) {
      setError('Veuillez préciser le conditionnement');
      return;
    }
    if (packageQuantity <= 0 || packageSize <= 0 || packagePrice <= 0) {
      setError('Quantité, conditionnement et prix doivent être > 0');
      return;
    }
    const quantity = packageQuantity * packageSize;
    const unitPrice = packagePrice / packageSize;
    setLines((prev) => [
      ...prev,
      {
        productId: lineProductId,
        quantity,
        unitPrice,
        packageType: linePackageType,
        packageLabel: linePackageLabel.trim() || undefined,
        packageSize,
        packageQuantity,
        packagePrice,
      },
    ]);
    setLineProductId('');
    setLinePackageType('UNITE');
    setLinePackageLabel('');
    setLinePackageSize('1');
    setLinePackageQuantity('1');
    setLinePackagePrice('0');
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const submitPurchase = async () => {
    if (!depotId || !supplierId || lines.length === 0) {
      setError('Veuillez remplir dépôt, fournisseur et lignes');
      return;
    }
    const hasInvalidLine = lines.some((line) => line.quantity <= 0 || line.unitPrice <= 0);
    if (hasInvalidLine) {
      setError('Chaque ligne doit avoir une quantité et un prix unitaire > 0');
      return;
    }

    const payload: CreatePurchaseRequest = {
      depotId,
      supplierId,
      lines: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
      notes: notes || undefined,
      deliveryDate: deliveryDate || undefined,
    };

    try {
      const created = await createMutation.mutateAsync(payload);
      const amount = getPurchaseTotal();
      if (amount > 0) {
        await payMutation.mutateAsync({ id: created.id, amount });
      }
      setSuccess('Achat créé');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/purchases');
        }
      }, 1200);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      const details = status ? ` (code ${status})` : '';
      setError(serverMessage ? `${serverMessage}${details}` : `Erreur lors de la création${details}`);
      console.error('Create purchase error:', err?.response?.data || err);
    }
  };

  const handleSubmit = async () => {
    setConfirmPayVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Nouvel achat
          </Text>

          <View style={styles.pickerContainer}>
            <Text variant="bodyMedium" style={styles.pickerLabel}>
              Dépôt *
            </Text>
            <Picker
              selectedValue={depotId}
              onValueChange={(value) => {
                setDepotId(value);
                setSelectedDepotId(value || null);
              }}
            >
              <Picker.Item label="Sélectionner un dépôt" value="" />
              {depots?.data?.map((depot) => (
                <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text variant="bodyMedium" style={styles.pickerLabel}>
              Fournisseur *
            </Text>
            <Picker selectedValue={supplierId} onValueChange={(value) => setSupplierId(value)}>
              <Picker.Item label="Sélectionner un fournisseur" value="" />
              {suppliers?.data?.map((supplier) => (
                <Picker.Item key={supplier.id} label={supplier.name} value={supplier.id} />
              ))}
            </Picker>
          </View>

          <TextInput
            label="Date de livraison"
            value={deliveryDate}
            mode="outlined"
            style={[styles.input, styles.readonlyInput]}
            disabled
          />

          <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" style={styles.input} />

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Ajouter une ligne
              </Text>
              <View style={styles.pickerContainer}>
                <Text variant="bodyMedium" style={styles.pickerLabel}>
                  Produit *
                </Text>
                <Picker selectedValue={lineProductId} onValueChange={(value) => setLineProductId(value)}>
                  <Picker.Item label="Sélectionner un produit" value="" />
                  {products?.data?.map((product) => (
                    <Picker.Item key={product.id} label={product.name} value={product.id} />
                  ))}
                </Picker>
              </View>

              {selectedProduct ? (
                <View style={styles.productPreview}>
                  {selectedProduct.imageUrl ? (
                    <Image source={{ uri: selectedProduct.imageUrl }} style={styles.productPreviewImage} />
                  ) : (
                    <View style={[styles.productPreviewImage, styles.productPreviewPlaceholder]}>
                      <Text variant="bodySmall" style={styles.previewPlaceholderText}>
                        Pas d'image
                      </Text>
                    </View>
                  )}
                  <View style={styles.productPreviewInfo}>
                    <Text variant="bodyMedium" style={styles.productPreviewName}>
                      {selectedProduct.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.productPreviewMeta}>
                      Stock actuel: {getStock(selectedProduct.id)}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.pickerContainer}>
                <Text variant="bodyMedium" style={styles.pickerLabel}>
                  Conditionnement *
                </Text>
                <Picker
                  selectedValue={linePackageType}
                  onValueChange={(value) => setLinePackageType(value as PackagingType)}
                >
                  <Picker.Item label="Unité" value="UNITE" />
                  <Picker.Item label="Casier" value="CASIER" />
                  <Picker.Item label="Carton" value="CARTON" />
                  <Picker.Item label="Paquet" value="PAQUET" />
                  <Picker.Item label="Autre" value="AUTRE" />
                </Picker>
              </View>

              {linePackageType === 'AUTRE' && (
                <TextInput
                  label="Libellé conditionnement *"
                  value={linePackageLabel}
                  onChangeText={setLinePackageLabel}
                  mode="outlined"
                  style={styles.input}
                />
              )}

              <TextInput
                label="Unités par conditionnement *"
                value={linePackageType === 'UNITE' ? '1' : linePackageSize}
                onChangeText={setLinePackageSize}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, linePackageType === 'UNITE' && styles.readonlyInput]}
                disabled={linePackageType === 'UNITE'}
              />

              <TextInput
                label="Quantité de conditionnements *"
                value={linePackageQuantity}
                onChangeText={setLinePackageQuantity}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                label="Prix par conditionnement *"
                value={linePackagePrice}
                onChangeText={setLinePackagePrice}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Affix text="FCFA" />}
                style={styles.input}
              />

              <TextInput
                label="Prix unitaire (calculé)"
                value={previewUnitPrice ? previewUnitPrice.toFixed(2) : '0'}
                mode="outlined"
                left={<TextInput.Affix text="FCFA" />}
                style={[styles.input, styles.readonlyInput]}
                disabled
              />
              <Button mode="outlined" onPress={handleAddLine}>
                Ajouter
              </Button>
            </Card.Content>
          </Card>

          {lines.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Lignes ({lines.length})
                </Text>
                {lines.map((line, index) => (
                  <View key={`${line.productId}-${index}`} style={styles.lineItem}>
                    <View style={styles.lineInfo}>
                      {products?.data?.find((p) => p.id === line.productId)?.imageUrl ? (
                        <Image
                          source={{ uri: products?.data?.find((p) => p.id === line.productId)?.imageUrl as string }}
                          style={styles.lineImage}
                        />
                      ) : (
                        <View style={[styles.lineImage, styles.lineImagePlaceholder]}>
                          <Text variant="bodySmall" style={styles.previewPlaceholderText}>
                            N/A
                          </Text>
                        </View>
                      )}
                      <Text variant="bodyMedium">
                        {products?.data?.find((p) => p.id === line.productId)?.name || 'Produit'}
                      </Text>
                      <Text variant="bodySmall" style={styles.lineMeta}>
                        {line.packageQuantity} {line.packageLabel || getPackageLabel(line.packageType)} ·{' '}
                        {line.packageSize} u
                      </Text>
                      <Text variant="bodySmall" style={styles.lineMeta}>
                        {line.quantity} u · {formatCurrency(line.unitPrice)} / u
                      </Text>
                      <Text variant="bodySmall" style={styles.lineMeta}>
                        Stock actuel: {getStock(line.productId)}
                      </Text>
                    </View>
                    <View style={styles.lineActions}>
                      <Text variant="bodyMedium">{formatCurrency(line.quantity * line.unitPrice)}</Text>
                      <IconButton icon="delete" size={18} onPress={() => handleRemoveLine(index)} />
                    </View>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text variant="titleSmall">Total</Text>
                  <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
                    {formatCurrency(total)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

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

      <Portal>
        <Dialog visible={confirmPayVisible} onDismiss={() => setConfirmPayVisible(false)}>
          <Dialog.Title>Confirmer le paiement</Dialog.Title>
          <Dialog.Content>
            <Text>
              Confirmez-vous le paiement automatique de {formatCurrency(total)} pour cet achat ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmPayVisible(false)}>Annuler</Button>
            <Button
              onPress={async () => {
                setConfirmPayVisible(false);
                await submitPurchase();
              }}
            >
              Confirmer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  card: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  lineInfo: {
    flex: 1,
  },
  lineImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    backgroundColor: '#EEE',
  },
  lineImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineMeta: {
    opacity: 0.6,
  },
  lineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  productPreviewImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: Spacing.sm,
    backgroundColor: '#EEE',
  },
  productPreviewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productPreviewInfo: {
    flex: 1,
  },
  productPreviewName: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  productPreviewMeta: {
    opacity: 0.7,
  },
  previewPlaceholderText: {
    opacity: 0.6,
  },
  totalRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
