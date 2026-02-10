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
import { useCategories, useDeleteCategory } from '@/hooks/useProducts';
import type { Category } from '@/types';

export default function CategoriesListScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, error, refetch } = useCategories();
  const deleteMutation = useDeleteCategory();

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data || [];
    return (data || []).filter((category) =>
      [category.name, category.description].some((value) =>
        (value || '').toLowerCase().includes(query)
      )
    );
  }, [data, search]);

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      await deleteMutation.mutateAsync(selectedCategory.id);
      setDeleteDialogVisible(false);
      setSelectedCategory(null);
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

  const renderCategory = ({ item }: { item: Category }) => (
    <Card style={styles.card} onPress={() => router.push(`/products/categories/edit/${item.id}`)}>
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
                router.push(`/products/categories/edit/${item.id}`);
              }}
              title="Modifier"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                setSelectedCategory(item);
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
      <SearchBar placeholder="Rechercher une catégorie..." onSearch={setSearch} />

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="tag"
              title="Aucune catégorie"
              message="Ajoutez votre première catégorie"
              actionLabel="Nouvelle catégorie"
              onAction={() => router.push('/products/categories/create')}
            />
          ) : null
        }
      />

      <FAB
        icon="plus"
        label="Nouvelle catégorie"
        style={styles.fab}
        onPress={() => router.push('/products/categories/create')}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>Supprimer la catégorie "{selectedCategory?.name}" ?</Text>
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
