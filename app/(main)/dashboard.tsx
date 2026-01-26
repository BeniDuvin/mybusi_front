import React from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { useTheme, FAB, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFinanceDashboard } from '@/hooks/useFinance';
import { useLowStockProducts } from '@/hooks/useProducts';
import { useAppStore } from '@/stores/app.store';
import { KPICard } from '@/components/ui/KPICard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useFinanceDashboard(selectedDepotId || undefined);

  const {
    data: lowStockProducts,
    isLoading: isLowStockLoading,
    refetch: refetchLowStock,
  } = useLowStockProducts(selectedDepotId || undefined);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDashboard(), refetchLowStock()]);
    setRefreshing(false);
  }, []);

  if (dashboardError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={dashboardError?.message || 'Erreur lors du chargement du tableau de bord'}
          onRetry={refetchDashboard}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Vue d'ensemble
        </Text>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KPICard
              title="Ventes du jour"
              value={dashboardData?.todaySales || 0}
              icon="cart"
              iconColor={theme.colors.primary}
              subtitle={formatCurrency(dashboardData?.todayRevenue || 0)}
            />
            <KPICard
              title="Ventes du mois"
              value={dashboardData?.monthSales || 0}
              icon="chart.bar"
              iconColor={theme.colors.secondary}
              subtitle={formatCurrency(dashboardData?.monthRevenue || 0)}
            />
          </View>

          <View style={styles.kpiRow}>
            <KPICard
              title="Stock faible"
              value={dashboardData?.lowStockCount || 0}
              icon="exclamationmark.triangle"
              iconColor={theme.colors.error}
              subtitle="Produits en alerte"
              onPress={() => router.push('/products?tab=low-stock')}
            />
            <KPICard
              title="Commandes en attente"
              value={dashboardData?.pendingOrdersCount || 0}
              icon="clock"
              iconColor="#FF9800"
              subtitle="À traiter"
            />
          </View>
        </View>

        {lowStockProducts && lowStockProducts.length > 0 && (
          <View style={styles.alertSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ⚠️ Alertes stock
            </Text>
            {lowStockProducts.slice(0, 5).map((product) => (
              <View key={product.id} style={styles.alertItem}>
                <Text variant="bodyMedium" style={styles.productName}>
                  {product.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                  Stock: {product.minStock} (Seuil: {product.minStock})
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Nouvelle vente"
        style={styles.fab}
        onPress={() => router.push('/sales/create')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    marginVertical: Spacing.md,
    fontWeight: 'bold',
  },
  kpiGrid: {
    marginBottom: Spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  alertSection: {
    marginTop: Spacing.lg,
  },
  alertItem: {
    padding: Spacing.md,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
