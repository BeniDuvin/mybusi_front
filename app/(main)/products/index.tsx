import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import {
  Card,
  Text,
  FAB,
  useTheme,
  Chip,
  Menu,
  IconButton,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { useAppStore } from '@/stores/app.store';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';

export default function ProductsListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data, isLoading, error, refetch } = useProducts({
    page,
    limit: 20,
    search,
    depotId: selectedDepotId || undefined,
  });

  const deleteMutation = useDeleteProduct();

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await deleteMutation.mutateAsync(selectedProduct.id);
      setDeleteDialogVisible(false);
      setSelectedProduct(null);
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.productCard} onPress={() => router.push(`/products/edit/${item.id}`)}>
      <Card.Content>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text variant="titleMedium" style={styles.productName}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.productSku}>
              SKU: {item.sku}
            </Text>
          </View>

          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(item.id)}
              />
            }
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

        {!item.isActive && (
          <Chip icon="close-circle" style={styles.inactiveChip}>
            Inactif
          </Chip>
        )}
      </Card.Content>
    </Card>
  );

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

      <FlatList
        data={data?.data || []}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: Spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
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
  inactiveChip: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: '#FFEBEE',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
