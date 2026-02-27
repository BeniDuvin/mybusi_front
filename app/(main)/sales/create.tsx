import { SearchBar } from '@/components/ui/SearchBar';
import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDepots } from '@/hooks/useDepots';
import { useProducts } from '@/hooks/useProducts';
import { useCreatePayment, useCreateSale } from '@/hooks/useSales';
import { useAppStore } from '@/stores/app.store';
import { useCartStore, type PackagingType } from '@/stores/cart.store';
import type { PaymentMethod, Product } from '@/types';
import {
    MOBILE_MONEY_PROVIDER_LABELS,
    MOBILE_MONEY_PROVIDERS,
    PAYMENT_METHOD_LABELS,
    PAYMENT_METHODS,
} from '@/utils/constants';
import { formatCurrency } from '@/utils/format';
import { Picker } from '@react-native-picker/picker';
import { PickerField } from '@/components/ui/PickerField';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Divider,
    IconButton,
    Modal,
    Portal,
    Snackbar,
    Switch,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateSaleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();
  const canManage = useAuthContext().hasRole(['ADMIN', 'GERANT']);

  React.useEffect(() => {
    if (!canManage) {
      router.replace('/sales');
    }
  }, [canManage, router]);

  const [search, setSearch] = useState('');
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [payNow, setPayNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CASH);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<
    keyof typeof MOBILE_MONEY_PROVIDERS | ''
  >('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const [linePackageType, setLinePackageType] = useState<PackagingType>('UNITE');
  const [linePackageLabel, setLinePackageLabel] = useState('');
  const [linePackageSize, setLinePackageSize] = useState('1');
  const [linePackageQuantity, setLinePackageQuantity] = useState('1');

  const getAvailableStock = (product: Product) => {
    return (
      product.quantity ??
      product.currentStock ??
      product.stockQuantity ??
      product.stock?.quantity ??
      null
    );
  };

  const getCartQuantity = (productId: string) => {
    return items.find((item) => item.product.id === productId)?.quantity ?? 0;
  };

  const { data: depots } = useDepots();
  const { data: products } = useProducts(
    {
      search,
      depotId: selectedDepotId || undefined,
      isActive: true,
    },
    {
      enabled: !!selectedDepotId,
      refetchInterval: 8000,
      refetchOnWindowFocus: true,
    }
  );

  const createSaleMutation = useCreateSale();
  const createPaymentMutation = useCreatePayment();
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clientId,
    clientName,
    discount,
    tax,
    notes,
    setClientName,
    setGlobalDiscount,
    setTax,
    clear,
  } = useCartStore();

  const [discountInput, setDiscountInput] = useState(discount ? discount.toString() : '');
  const [taxInput, setTaxInput] = useState(tax ? tax.toString() : '');

  useEffect(() => {
    setDiscountInput(discount ? discount.toString() : '');
  }, [discount]);

  useEffect(() => {
    setTaxInput(tax ? tax.toString() : '');
  }, [tax]);

  const itemsCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const toNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = toNumber(item.quantity);
      const price = toNumber(item.unitPrice);
      const lineDiscount = toNumber(item.discount);
      const lineTotal = qty * price - lineDiscount;
      return sum + lineTotal;
    }, 0);
  }, [items]);

  const total = useMemo(() => {
    return subtotal - toNumber(discount) + toNumber(tax);
  }, [subtotal, discount, tax]);

  useEffect(() => {
    if (total > 0) {
      setPaymentAmount(total.toString());
    }
  }, [total]);

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

  const handleAddProduct = (product: Product) => {
    const available = getAvailableStock(product);
    const currentQty = getCartQuantity(product.id);
    if (available !== null && currentQty >= available) {
      setError(`Stock insuffisant pour ${product.name} (disponible: ${available})`);
      return;
    }
    setSelectedProduct(product);
    setQuantityModalVisible(true);
  };

  const confirmAddProduct = () => {
    if (!selectedProduct) return;
    const packageQuantity = parseInt(linePackageQuantity) || 0;
    const packageSize = linePackageType === 'UNITE' ? 1 : parseInt(linePackageSize) || 0;
    if (linePackageType === 'AUTRE' && !linePackageLabel.trim()) {
      setError('Veuillez préciser le conditionnement');
      return;
    }
    if (packageQuantity <= 0 || packageSize <= 0) {
      setError('Quantité et conditionnement doivent être > 0');
      return;
    }
    const desired = packageQuantity * packageSize;
    const available = getAvailableStock(selectedProduct);
    const currentQty = getCartQuantity(selectedProduct.id);
    if (available !== null && currentQty + desired > available) {
      setError(
        `Stock insuffisant pour ${selectedProduct.name} (disponible: ${available})`
      );
      return;
    }
    addItem(selectedProduct, desired, {
      packageType: linePackageType,
      packageLabel: linePackageLabel.trim() || undefined,
      packageSize,
      packageQuantity,
    });
    setQuantityModalVisible(false);
    setSelectedProduct(null);
    setLinePackageType('UNITE');
    setLinePackageLabel('');
    setLinePackageSize('1');
    setLinePackageQuantity('1');
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('Veuillez ajouter au moins un produit');
      return;
    }

    if (!selectedDepotId) {
      setError('Veuillez sélectionner un dépôt');
      return;
    }

    if (payNow) {
      const amount = parseFloat(paymentAmount) || 0;
      if (amount <= 0) {
        setError('Veuillez saisir un montant de paiement valide');
        return;
      }
      if (Math.abs(amount - total) > 0.01) {
        setError('Le montant payé doit être égal au total');
        return;
      }

      if (paymentMethod === PAYMENT_METHODS.MOBILE_MONEY) {
        if (!mobileMoneyProvider || !mobileMoneyNumber) {
          setError('Veuillez renseigner le provider et le numéro Mobile Money');
          return;
        }
      }
    }

    try {
      const clientNameNote = clientName.trim();
      const notesValue = notes.trim();
      const composedNotes = [
        clientNameNote ? `Client: ${clientNameNote}` : null,
        notesValue || null,
      ]
        .filter(Boolean)
        .join(' | ');

      const sale = await createSaleMutation.mutateAsync({
        depotId: selectedDepotId,
        clientId: clientId || undefined,
        lines: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        discount,
        tax,
        notes: composedNotes || undefined,
      });

      if (payNow) {
        await createPaymentMutation.mutateAsync({
          saleId: sale.id,
          amount: total,
          method: paymentMethod,
          mobileMoneyProvider:
            paymentMethod === PAYMENT_METHODS.MOBILE_MONEY ? mobileMoneyProvider : undefined,
          mobileMoneyNumber:
            paymentMethod === PAYMENT_METHODS.MOBILE_MONEY ? mobileMoneyNumber : undefined,
          reference: paymentReference || undefined,
        });
      }

      clear();
      const autoPrint = payNow ? '1' : '0';
      router.replace(`/sales/invoice/${sale.id}?autoPrint=${autoPrint}&format=58mm`);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      const details = status ? ` (code ${status})` : '';
      setError(serverMessage ? `${serverMessage}${details}` : `Erreur lors de la création${details}`);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card
      style={[styles.productCard, { borderColor: theme.colors.outline }]}
      onPress={() => handleAddProduct(item)}
    >
      <Card.Content>
        <View style={styles.productRow}>
          <View style={styles.productInfo}>
            <Text variant="titleSmall">{item.name}</Text>
            <Text variant="bodySmall" style={styles.productPrice}>
              {formatCurrency(item.sellingPrice)}
            </Text>
            {getAvailableStock(item) !== null && (
              <Text variant="bodySmall" style={styles.productStock}>
                Stock: {getAvailableStock(item)}
              </Text>
            )}
          </View>
          <IconButton icon="plus" onPress={() => handleAddProduct(item)} />
        </View>
      </Card.Content>
    </Card>
  );

  const renderCartItem = (item: typeof items[0], index: number) => (
    <View key={item.product.id} style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text variant="bodyMedium" style={styles.cartItemName}>
          {item.product.name}
        </Text>
        <Text variant="bodySmall" style={styles.cartItemPrice}>
          {formatCurrency(item.unitPrice)} x {item.quantity}
        </Text>
        <Text variant="bodySmall" style={styles.cartItemMeta}>
          {item.packageQuantity} {item.packageLabel || getPackageLabel(item.packageType)} ·{' '}
          {item.packageSize} u
        </Text>
      </View>

      <View style={styles.cartItemActions}>
        <IconButton
          icon="minus-circle-outline"
          size={18}
          onPress={() => {
            const nextQty = item.quantity - 1;
            if (nextQty <= 0) {
              removeItem(item.product.id);
            } else {
              updateQuantity(item.product.id, nextQty);
            }
          }}
        />
        <Text variant="titleSmall" style={styles.cartItemTotal}>
          {formatCurrency(item.quantity * item.unitPrice)}
        </Text>
        <IconButton
          icon="plus-circle-outline"
          size={18}
          onPress={() => {
            const available = getAvailableStock(item.product);
            const nextQty = item.quantity + 1;
            if (available !== null && nextQty > available) {
              setError(
                `Stock insuffisant pour ${item.product.name} (disponible: ${available})`
              );
              return;
            }
            updateQuantity(item.product.id, nextQty);
          }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={products?.data || []}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <Text variant="headlineSmall" style={styles.heroTitle}>
                Nouvelle vente
              </Text>
              <Text variant="bodySmall" style={styles.heroSubtitle}>
                Sélectionnez un dépôt puis ajoutez des produits au panier.
              </Text>
            </View>

            <Card style={styles.headerCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Dépôt
                </Text>
                <PickerField
                  label="Dépôt *"
                  selectedValue={selectedDepotId || ''}
                  onValueChange={(value) => setSelectedDepotId(value || null)}
                >
                  <Picker.Item label="Sélectionner un dépôt" value="" />
                  {depots?.data?.map((depot) => (
                    <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
                  ))}
                </PickerField>

                <SearchBar placeholder="Rechercher un produit..." onSearch={setSearch} />

                <TextInput
                  label="Nom du client (optionnel)"
                  value={clientName}
                  onChangeText={setClientName}
                  mode="outlined"
                  style={styles.input}
                />

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text variant="labelSmall" style={styles.summaryLabel}>
                      Articles
                    </Text>
                    <Text variant="titleSmall" style={styles.summaryValue}>
                      {itemsCount}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text variant="labelSmall" style={styles.summaryLabel}>
                      Total
                    </Text>
                    <Text
                      variant="titleSmall"
                      style={[styles.summaryValue, { color: theme.colors.primary }]}
                    >
                      {formatCurrency(total)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            <View style={styles.sectionHeaderRow}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Catalogue produits
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View
            style={[
              styles.cartSection,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
            ]}
          >
            <Text variant="titleMedium" style={styles.cartTitle}>
              Panier ({itemsCount} articles)
            </Text>

            {items.length === 0 ? (
              <Text variant="bodySmall" style={styles.cartEmpty}>
                Aucun article ajouté
              </Text>
            ) : (
              <View style={styles.cartItems}>{items.map(renderCartItem)}</View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.adjustments}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Remise et taxes (optionnels)
              </Text>
              <TextInput
                label="Remise"
                value={discountInput}
                onChangeText={(text) => {
                  setDiscountInput(text);
                  const value = parseFloat(text.replace(',', '.'));
                  setGlobalDiscount(Number.isFinite(value) ? value : 0);
                }}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Affix text="FCFA" />}
                style={styles.input}
              />
              <TextInput
                label="Taxes"
                value={taxInput}
                onChangeText={(text) => {
                  setTaxInput(text);
                  const value = parseFloat(text.replace(',', '.'));
                  setTax(Number.isFinite(value) ? value : 0);
                }}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Affix text="FCFA" />}
                style={styles.input}
              />
            </View>

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text variant="bodyLarge">Sous-total:</Text>
                <Text variant="bodyLarge">{formatCurrency(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text variant="bodyLarge">Remise:</Text>
                <Text variant="bodyLarge">{formatCurrency(toNumber(discount))}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text variant="bodyLarge">Taxes:</Text>
                <Text variant="bodyLarge">{formatCurrency(toNumber(tax))}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text variant="titleMedium" style={styles.grandTotal}>
                  Total:
                </Text>
                <Text variant="titleMedium" style={styles.grandTotal}>
                  {formatCurrency(total)}
                </Text>
              </View>
            </View>

            <Divider style={styles.sectionDivider} />
            <View style={styles.payRow}>
              <Text variant="bodyMedium">Encaisser maintenant</Text>
              <Switch value={payNow} onValueChange={setPayNow} />
            </View>

            {payNow && (
              <View>
                <PickerField
                  label="Méthode de paiement"
                  selectedValue={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                >
                  {Object.values(PAYMENT_METHODS).map((method) => (
                    <Picker.Item
                      key={method}
                      label={PAYMENT_METHOD_LABELS[method]}
                      value={method}
                    />
                  ))}
                </PickerField>

                <TextInput
                  label="Montant payé"
                  value={paymentAmount}
                  mode="outlined"
                  left={<TextInput.Affix text="FCFA" />}
                  style={styles.input}
                  editable={false}
                />

                {paymentMethod === PAYMENT_METHODS.MOBILE_MONEY && (
                  <>
                    <PickerField
                      label="Provider Mobile Money"
                      selectedValue={mobileMoneyProvider}
                      onValueChange={(value) => setMobileMoneyProvider(value as any)}
                    >
                      <Picker.Item label="Sélectionner un provider" value="" />
                      {Object.values(MOBILE_MONEY_PROVIDERS).map((provider) => (
                        <Picker.Item
                          key={provider}
                          label={MOBILE_MONEY_PROVIDER_LABELS[provider]}
                          value={provider}
                        />
                      ))}
                    </PickerField>

                    <TextInput
                      label="Numéro Mobile Money"
                      value={mobileMoneyNumber}
                      onChangeText={setMobileMoneyNumber}
                      mode="outlined"
                      keyboardType="phone-pad"
                      style={styles.input}
                    />
                  </>
                )}

                <TextInput
                  label="Référence (optionnelle)"
                  value={paymentReference}
                  onChangeText={setPaymentReference}
                  mode="outlined"
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.actions}>
              <Button mode="outlined" onPress={clear} style={styles.clearButton}>
                Vider
              </Button>
              <Button
                mode="contained"
                onPress={handleCheckout}
                loading={createSaleMutation.isPending || createPaymentMutation.isPending}
                disabled={
                  items.length === 0 ||
                  createSaleMutation.isPending ||
                  createPaymentMutation.isPending
                }
                style={styles.checkoutButton}
              >
                Valider
              </Button>
            </View>
          </View>
        }
      />

      {/* Quantity Modal */}
      <Portal>
        <Modal
          visible={quantityModalVisible}
          onDismiss={() => setQuantityModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Quantité
          </Text>

          <Text variant="bodyMedium" style={styles.modalProduct}>
            {selectedProduct?.name}
          </Text>

          <View style={styles.modalImageRow}>
            {selectedProduct?.imageUrl ? (
              <Image source={{ uri: selectedProduct.imageUrl }} style={styles.modalImage} />
            ) : (
              <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                <Text variant="bodySmall" style={styles.modalImageText}>
                  Pas d'image
                </Text>
              </View>
            )}
          </View>

          <PickerField
            label="Conditionnement *"
            selectedValue={linePackageType}
            onValueChange={(value) => setLinePackageType(value as PackagingType)}
          >
            <Picker.Item label="Unité" value="UNITE" />
            <Picker.Item label="Casier" value="CASIER" />
            <Picker.Item label="Carton" value="CARTON" />
            <Picker.Item label="Paquet" value="PAQUET" />
            <Picker.Item label="Autre" value="AUTRE" />
          </PickerField>

          {linePackageType === 'AUTRE' && (
            <TextInput
              label="Libellé conditionnement *"
              value={linePackageLabel}
              onChangeText={setLinePackageLabel}
              mode="outlined"
              style={styles.quantityInput}
            />
          )}

          <TextInput
            label="Unités par conditionnement *"
            value={linePackageType === 'UNITE' ? '1' : linePackageSize}
            onChangeText={setLinePackageSize}
            keyboardType="numeric"
            mode="outlined"
            style={[styles.quantityInput, linePackageType === 'UNITE' && styles.readonlyInput]}
            disabled={linePackageType === 'UNITE'}
          />

          <TextInput
            label="Quantité de conditionnements *"
            value={linePackageQuantity}
            onChangeText={setLinePackageQuantity}
            keyboardType="numeric"
            mode="outlined"
            style={styles.quantityInput}
          />

          <Text variant="bodySmall" style={styles.modalHelper}>
            Quantité totale: {(parseInt(linePackageQuantity) || 0) * (linePackageType === 'UNITE' ? 1 : parseInt(linePackageSize) || 0)} unités
          </Text>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setQuantityModalVisible(false)}>
              Annuler
            </Button>
            <Button mode="contained" onPress={confirmAddProduct}>
              Ajouter
            </Button>
          </View>
        </Modal>
      </Portal>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.md,
  },
  hero: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontWeight: 'bold',
  },
  heroSubtitle: {
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  headerCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
  },
  sectionHeaderRow: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    opacity: 0.6,
  },
  summaryValue: {
    fontWeight: 'bold',
    marginTop: Spacing.xs,
  },
  productsList: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  productCard: {
    marginBottom: Spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productPrice: {
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  productStock: {
    marginTop: Spacing.xs,
    opacity: 0.6,
  },
  cartSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  cartTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  cartEmpty: {
    opacity: 0.6,
    marginBottom: Spacing.md,
  },
  cartItems: {
    marginBottom: Spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    marginBottom: Spacing.xs,
  },
  cartItemPrice: {
    opacity: 0.6,
  },
  cartItemMeta: {
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemTotal: {
    fontWeight: 'bold',
    marginRight: Spacing.sm,
  },
  divider: {
    marginVertical: Spacing.md,
  },
  sectionDivider: {
    marginVertical: Spacing.md,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  input: {
    marginBottom: Spacing.sm,
  },
  readonlyInput: {
    opacity: 0.7,
  },
  totals: {
    marginBottom: Spacing.lg,
  },
  adjustments: {
    marginBottom: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  grandTotal: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  clearButton: {
    flex: 1,
  },
  checkoutButton: {
    flex: 2,
  },
  modal: {
    backgroundColor: 'white',
    padding: Spacing.xl,
    margin: Spacing.xl,
    borderRadius: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  modalProduct: {
    marginBottom: Spacing.lg,
  },
  modalImageRow: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  modalImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageText: {
    opacity: 0.6,
  },
  quantityInput: {
    marginBottom: Spacing.lg,
  },
  modalHelper: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
