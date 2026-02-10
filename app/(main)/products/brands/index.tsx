import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
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
import { useRouter } from 'expo-router';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { useBrands, useDeleteBrand } from '@/hooks/useProducts';
import type { Brand } from '@/types';

export default function BrandsListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, error, refetch } = useBrands();
  const deleteMutation = useDeleteBrand();

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data || [];
    return (data || []).filter((brand) =>
      [brand.name, brand.description].some((value) =>
        (value || '').toLowerCase().includes(query)
      )
    );
  }, [data, search]);

  const handleDelete = async () => {
    if (!selectedBrand) return;
    try {
      await deleteMutation.mutateAsync(selectedBrand.id);
      setDeleteDialogVisible(false);
      setSelectedBrand(null);
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
    }
  };

  const renderBrand = ({ item }: { item: Brand }) => (
    <Card style={styles.card} onPress={() => router.push(`/products/brands/edit/${item.id}`)}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text variant="titleMedium" style={styles.name}>
              {item.name}
            </Text>
            {item.description ? (
              <Text variant="bodySmall" style={styles.meta}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(item.id)} />}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                router.push(`/products/brands/edit/${item.id}`);
              }}
              title="Modifier"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                setSelectedBrand(item);
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error?.message || 'Erreur lors du chargement'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar placeholder="Rechercher une marque..." onSearch={setSearch} />

      <FlatList
        data={filteredBrands}
        renderItem={renderBrand}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="tag-outline"
              title="Aucune marque"
              message="Ajoutez votre première marque"
              actionLabel="Nouvelle marque"
              onAction={() => router.push('/products/brands/create')}
            />
          ) : null
        }
      />

      <FAB
        icon="plus"
        label="Nouvelle marque"
        style={styles.fab}
        onPress={() => router.push('/products/brands/create')}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>Supprimer la marque "{selectedBrand?.name}" ?</Text>
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
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  meta: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
