import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SearchBar } from '@/components/ui/SearchBar';
import { Spacing } from '@/constants/theme';
import { useDeleteProduct, useProducts, useCategories } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/usePurchases';
import { useDepots } from '@/hooks/useDepots';
import { useAppStore } from '@/stores/app.store';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { stockService } from '@/services/stock.service';
import { Picker } from '@react-native-picker/picker';
import { PickerField } from '@/components/ui/PickerField';
import {
    Button,
    Card,
    Chip,
    Dialog,
    FAB,
    IconButton,
    Menu,
    Portal,
    Snackbar,
    Text,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductsListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [depotId, setDepotId] = useState(selectedDepotId || '');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const { data: depots } = useDepots();

  const { data, isLoading, error, refetch } = useProducts(
    {
      page,
      limit: 20,
      search,
      categoryId: categoryId || undefined,
      supplierId: supplierId || undefined,
      depotId: depotId || selectedDepotId || undefined,
    },
    {
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    }
  );

  const deleteMutation = useDeleteProduct();

  React.useEffect(() => {
    if (!selectedDepotId && !depotId) {
      const firstDepotId = data?.data?.find((product) => product.depotId)?.depotId;
      if (firstDepotId) {
        setSelectedDepotId(firstDepotId);
        setDepotId(firstDepotId);
      }
    }
  }, [selectedDepotId, depotId, data?.data, setSelectedDepotId]);

  const { data: stockData, refetch: refetchStock } = useQuery({
    queryKey: ['stock', 'depot', depotId || selectedDepotId],
    queryFn: () => stockService.getByDepot((depotId || selectedDepotId) as string, { limit: 1000 }),
    enabled: !!(depotId || selectedDepotId),
  });

  const stockByProductId = useMemo(() => {
    const map = new Map<string, number>();
    stockData?.data?.forEach((stock) => {
      map.set(stock.productId, stock.quantity ?? 0);
    });
    return map;
  }, [stockData?.data]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
      refetchStock();
    }, [refetch, refetchStock])
  );

  React.useEffect(() => {
    if (depotId || selectedDepotId) {
      refetch();
      refetchStock();
    }
  }, [depotId, selectedDepotId, refetch, refetchStock]);

  const getStock = (product: Product) => {
    const activeDepotId = depotId || selectedDepotId;
    const stockFromProduct = activeDepotId
      ? product.stocks?.find((stock) => stock.depotId === activeDepotId)?.quantity
      : undefined;

    return (
      stockByProductId.get(product.id) ??
      stockFromProduct ??
      product.quantity ??
      product.currentStock ??
      product.stockQuantity ??
      product.stock?.quantity ??
      0
    );
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await deleteMutation.mutateAsync(selectedProduct.id);
      setDeleteDialogVisible(false);
      setSelectedProduct(null);
      refetch();
    } catch (err) {
      const status = (err as any)?.response?.status;
      const serverMessage = (err as any)?.response?.data?.message;
      const details = status ? ` (code ${status})` : '';
      setDeleteError(
        serverMessage
          ? `${serverMessage}${details}`
          : `Erreur lors de la suppression${details}`
      );
      console.error('Delete error:', err);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const stock = getStock(item);
    const isLowStock = stock <= item.minStock;

    return (
    <Card style={[styles.productCard, { borderColor: theme.colors.outline }]}>
      <Card.Content>
        <Pressable
          onPress={() => router.push(`/products/edit/${item.id}`)}
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        >
          <View style={styles.imageWrapper}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Pas d'image
                </Text>
              </View>
            )}
          </View>

          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text variant="titleMedium" style={styles.productName}>
                {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.productSku}>
                SKU: {item.sku}
              </Text>
              <Text variant="bodySmall" style={styles.productMeta}>
                Dépôt: {item.depot?.name || item.depotId}
              </Text>
            </View>
            <Chip
              icon={item.isActive ? 'check-circle' : 'close-circle'}
              style={[
                styles.statusChip,
                { backgroundColor: item.isActive ? theme.colors.primary : theme.colors.error },
              ]}
              textStyle={styles.statusText}
            >
              {item.isActive ? 'Actif' : 'Inactif'}
            </Chip>
          </View>

          <View style={styles.stockRow}>
            <Text
              variant="bodySmall"
              style={[styles.stockText, isLowStock && { color: theme.colors.error }]}
            >
              Stock: {stock} (Seuil: {item.minStock})
            </Text>
          </View>

          <View style={styles.productDetails}>
            <Chip icon="tag" style={styles.chip}>
              {item.category?.name || 'Sans catégorie'}
            </Chip>
            <Chip icon="tag-outline" style={styles.chip}>
              {item.brand?.name || 'Sans marque'}
            </Chip>
          </View>

          <View style={styles.productPrices}>
            <View>
              <Text variant="bodySmall" style={styles.priceLabel}>
                Achat
              </Text>
              <Text variant="titleSmall" style={styles.priceValue}>
                {formatCurrency(item.purchasePrice)}
              </Text>
            </View>
            <View>
              <Text variant="bodySmall" style={styles.priceLabel}>
                Vente
              </Text>
              <Text variant="titleSmall" style={[styles.priceValue, { color: theme.colors.primary }]}>
                {formatCurrency(item.sellingPrice)}
              </Text>
            </View>
          </View>

        </Pressable>

        <View style={styles.menuAnchor}>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(item.id)} />}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                router.push(`/products/edit/${item.id}`);
              }}
              title="Modifier"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                setSelectedProduct(item);
                setDeleteDialogVisible(true);
              }}
              title="Supprimer"
              leadingIcon="delete"
            />
          </Menu>
        </View>
      </Card.Content>
    </Card>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={error?.message || 'Erreur lors du chargement des produits'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar placeholder="Rechercher un produit..." onSearch={setSearch} />

      <View style={styles.filtersRow}>
        <PickerField
          variant="filter"
          label="Catégorie"
          selectedValue={categoryId}
          onValueChange={(value) => setCategoryId(value)}
          containerStyle={styles.filterPickerField}
        >
          <Picker.Item label="Toutes" value="" />
          {categories?.map((category) => (
            <Picker.Item key={category.id} label={category.name} value={category.id} />
          ))}
        </PickerField>

        <PickerField
          variant="filter"
          label="Dépôt"
          selectedValue={depotId || selectedDepotId || ''}
          onValueChange={(value) => {
            setDepotId(value);
            setSelectedDepotId(value || null);
          }}
          containerStyle={styles.filterPickerField}
        >
          <Picker.Item label="Tous" value="" />
          {depots?.data?.map((depot) => (
            <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
          ))}
        </PickerField>

        <PickerField
          variant="filter"
          label="Fournisseur"
          selectedValue={supplierId}
          onValueChange={(value) => setSupplierId(value)}
          containerStyle={styles.filterPickerField}
        >
          <Picker.Item label="Tous" value="" />
          {suppliers?.data?.map((supplier) => (
            <Picker.Item key={supplier.id} label={supplier.name} value={supplier.id} />
          ))}
        </PickerField>
      </View>

      <FlatList
        data={data?.data || []}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              setPage(1);
              refetch();
              refetchStock();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="cube.box"
              title="Aucun produit"
              message="Commencez par ajouter votre premier produit"
              actionLabel="Ajouter un produit"
              onAction={() => router.push('/products/create')}
            />
          ) : null
        }
        onEndReached={() => {
          if (data?.meta && page < data.meta.totalPages) {
            setPage(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />

      <FAB
        icon="plus"
        label="Nouveau produit"
        style={styles.fab}
        onPress={() => router.push('/products/create')}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>
              Êtes-vous sûr de vouloir supprimer le produit "{selectedProduct?.name}" ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Annuler</Button>
            <Button
              onPress={handleDelete}
              loading={deleteMutation.isPending}
              textColor={theme.colors.error}
            >
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!deleteError} onDismiss={() => setDeleteError('')} duration={3000}>
        {deleteError}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterPickerField: {
    flex: 1,
    marginBottom: 0,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pressable: {
    paddingRight: 40,
  },
  pressed: {
    opacity: 0.9,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  imageWrapper: {
    marginBottom: Spacing.sm,
  },
  productImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  productSku: {
    opacity: 0.6,
  },
  productMeta: {
    opacity: 0.6,
  },
  statusChip: {
    borderRadius: 999,
  },
  statusText: {
    color: '#fff',
  },
  stockRow: {
    marginBottom: Spacing.sm,
  },
  stockText: {
    opacity: 0.8,
  },
  productDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  chip: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  productPrices: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  priceLabel: {
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  priceValue: {
    fontWeight: 'bold',
  },
  menuAnchor: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
