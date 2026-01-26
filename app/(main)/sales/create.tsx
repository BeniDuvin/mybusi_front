import React, { useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView } from 'react-native';
import {
  Card,
  Text,
  Button,
  useTheme,
  Searchbar,
  IconButton,
  Divider,
  Snackbar,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProducts } from '@/hooks/useProducts';
import { useCreateSale } from '@/hooks/useSales';
import { useCartStore } from '@/stores/cart.store';
import { useAppStore } from '@/stores/app.store';
import { Spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';

export default function CreateSaleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();

  const [search, setSearch] = useState('');
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  const { data: products } = useProducts({
    search,
    depotId: selectedDepotId || undefined,
    isActive: true,
  });

  const createSaleMutation = useCreateSale();
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTotal,
    getItemsCount,
    clear,
  } = useCartStore();

  const handleAddProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantityModalVisible(true);
  };

  const confirmAddProduct = () => {
    if (selectedProduct && parseInt(quantity) > 0) {
      addItem(selectedProduct, parseInt(quantity));
      setQuantityModalVisible(false);
      setSelectedProduct(null);
      setQuantity('1');
    }
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

    try {
      await createSaleMutation.mutateAsync({
        depotId: selectedDepotId,
        lines: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        discount: 0,
        tax: 0,
      });

      clear();
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la vente');
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.productCard} onPress={() => handleAddProduct(item)}>
      <Card.Content>
        <View style={styles.productRow}>
          <View style={styles.productInfo}>
            <Text variant="titleSmall">{item.name}</Text>
            <Text variant="bodySmall" style={styles.productPrice}>
              {formatCurrency(item.sellingPrice)}
            </Text>
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
      </View>

      <View style={styles.cartItemActions}>
        <Text variant="titleSmall" style={styles.cartItemTotal}>
          {formatCurrency(item.quantity * item.unitPrice)}
        </Text>
        <IconButton
          icon="delete"
          size={20}
          onPress={() => removeItem(item.product.id)}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Products List */}
        <View style={styles.productsSection}>
          <Searchbar
            placeholder="Rechercher un produit..."
            onChangeText={setSearch}
            value={search}
            style={styles.searchBar}
          />

          <FlatList
            data={products?.data || []}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productsList}
          />
        </View>

        {/* Cart Summary */}
        <View style={[styles.cartSection, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleMedium" style={styles.cartTitle}>
            Panier ({getItemsCount()} articles)
          </Text>

          <ScrollView style={styles.cartItems}>
            {items.map(renderCartItem)}
          </ScrollView>

          <Divider style={styles.divider} />

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text variant="bodyLarge">Sous-total:</Text>
              <Text variant="bodyLarge">{formatCurrency(getSubtotal())}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text variant="titleMedium" style={styles.grandTotal}>
                Total:
              </Text>
              <Text variant="titleMedium" style={styles.grandTotal}>
                {formatCurrency(getTotal())}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={clear} style={styles.clearButton}>
              Vider
            </Button>
            <Button
              mode="contained"
              onPress={handleCheckout}
              loading={createSaleMutation.isPending}
              disabled={items.length === 0 || createSaleMutation.isPending}
              style={styles.checkoutButton}
            >
              Valider
            </Button>
          </View>
        </View>
      </View>

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

          <TextInput
            label="Quantité"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            mode="outlined"
            style={styles.quantityInput}
          />

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
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  productsSection: {
    flex: 1,
  },
  searchBar: {
    margin: Spacing.md,
  },
  productsList: {
    padding: Spacing.md,
  },
  productCard: {
    marginBottom: Spacing.sm,
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
  cartSection: {
    width: 350,
    padding: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  cartTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  cartItems: {
    flex: 1,
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
  totals: {
    marginBottom: Spacing.lg,
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
  quantityInput: {
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
