import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { KPICard } from '@/components/ui/KPICard';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDepots } from '@/hooks/useDepots';
import { useExpenses, useFinanceDashboard, useFinanceSummary } from '@/hooks/useFinance';
import { useLowStockProducts, useProducts } from '@/hooks/useProducts';
import { usePurchases } from '@/hooks/usePurchases';
import { useSales } from '@/hooks/useSales';
import { stockService } from '@/services/stock.service';
import { useAppStore } from '@/stores/app.store';
import type { Purchase, Sale } from '@/types';
import { formatCurrency } from '@/utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, FAB, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId, setSelectedDepotId } = useAppStore();
  const { hasRole } = useAuthContext();
  const canViewFinance = hasRole(['ADMIN', 'GERANT']);
  const [statsTab, setStatsTab] = useState<'sales' | 'purchases'>('sales');

  const toNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getCurrentStock = (product: {
    quantity?: number;
    currentStock?: number;
    stockQuantity?: number;
    stock?: { quantity?: number };
    stocks?: { depotId: string; quantity: number }[];
  }) => {
    const stockFromArray = selectedDepotId
      ? product.stocks?.find((stock) => stock.depotId === selectedDepotId)?.quantity
      : product.stocks?.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    return (
      stockFromArray ??
      product.quantity ??
      product.currentStock ??
      product.stockQuantity ??
      product.stock?.quantity ??
      0
    );
  };

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useFinanceDashboard({
    depotId: selectedDepotId || undefined,
    enabled: canViewFinance,
  });

  const { todayParams, monthParams } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      todayParams: {
        depotId: selectedDepotId || undefined,
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      },
      monthParams: {
        depotId: selectedDepotId || undefined,
        startDate: startOfMonth.toISOString(),
        endDate: endOfDay.toISOString(),
      },
    };
  }, [selectedDepotId]);

  const {
    data: todaySummary,
    isLoading: isTodaySummaryLoading,
    refetch: refetchTodaySummary,
  } = useFinanceSummary(todayParams, { enabled: canViewFinance });

  const {
    data: monthSummary,
    isLoading: isMonthSummaryLoading,
    refetch: refetchMonthSummary,
  } = useFinanceSummary(monthParams, { enabled: canViewFinance });

  const {
    data: purchasesData,
    isLoading: isPurchasesLoading,
    refetch: refetchPurchases,
  } = usePurchases({
    depotId: selectedDepotId || undefined,
    limit: 500,
  });

  const {
    data: salesData,
    isLoading: isSalesLoading,
    refetch: refetchSales,
  } = useSales({
    depotId: selectedDepotId || undefined,
    limit: 500,
  });

  const {
    data: lowStockProducts,
    isLoading: isLowStockLoading,
    refetch: refetchLowStock,
  } = useLowStockProducts(selectedDepotId || undefined);

  const { data: productsData, refetch: refetchProducts } = useProducts({
    depotId: selectedDepotId || undefined,
    limit: 1000,
  });

  const { data: monthExpensesData, isLoading: isExpensesLoading, refetch: refetchExpenses } = useExpenses({
    depotId: selectedDepotId || undefined,
    startDate: monthParams.startDate,
    endDate: monthParams.endDate,
    limit: 1000,
  });

  const { data: depots } = useDepots();

  const { data: stockData, refetch: refetchStock } = useQuery({
    queryKey: ['stock', 'depot', selectedDepotId],
    queryFn: () => stockService.getByDepot(selectedDepotId as string, { limit: 1000 }),
    enabled: !!selectedDepotId,
  });

  const stockByProductId = useMemo(() => {
    const map = new Map<string, number>();
    stockData?.data?.forEach((stock) => {
      map.set(stock.productId, stock.quantity ?? 0);
    });
    return map;
  }, [stockData?.data]);

  const [refreshing, setRefreshing] = React.useState(false);
  const chartWidth = Dimensions.get('window').width - Spacing.md * 2;
  const safeDashboard = {
    todaySales: toNumber(dashboardData?.todaySales),
    todayRevenue: toNumber(dashboardData?.todayRevenue),
    monthSales: toNumber(dashboardData?.monthSales),
    monthRevenue: toNumber(dashboardData?.monthRevenue),
    lowStockCount: toNumber(dashboardData?.lowStockCount),
    pendingOrdersCount: toNumber(dashboardData?.pendingOrdersCount),
  };

  const getPreferredMetric = (value: unknown, fallback: number) => {
    const apiValue = toNumber(value);
    return apiValue > 0 ? apiValue : fallback;
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDashboard(),
      refetchLowStock(),
      refetchStock(),
      refetchTodaySummary(),
      refetchMonthSummary(),
      refetchPurchases(),
      refetchSales(),
      refetchProducts(),
      refetchExpenses(),
    ]);
    setRefreshing(false);
  }, [
    refetchDashboard,
    refetchLowStock,
    refetchStock,
    refetchTodaySummary,
    refetchMonthSummary,
    refetchPurchases,
    refetchSales,
    refetchProducts,
    refetchExpenses,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (canViewFinance) {
        refetchDashboard();
        refetchTodaySummary();
        refetchMonthSummary();
        refetchPurchases();
        refetchSales();
        refetchProducts();
        refetchExpenses();
      }
      refetchLowStock();
      refetchStock();
    }, [
      canViewFinance,
      refetchDashboard,
      refetchTodaySummary,
      refetchMonthSummary,
      refetchPurchases,
      refetchSales,
      refetchProducts,
      refetchExpenses,
      refetchLowStock,
      refetchStock,
    ])
  );

  const getPurchaseTotal = (purchase: Purchase) => {
    const total = toNumber(purchase?.total);
    if (total > 0) return total;
    return (purchase?.lines || []).reduce(
      (sum, line) => sum + toNumber(line.quantity) * toNumber(line.unitPrice),
      0
    );
  };

  const purchaseStats = useMemo(() => {
    const data = purchasesData?.data || [];
    if (data.length === 0) {
      return { todayCount: 0, monthCount: 0, todayAmount: 0, monthAmount: 0 };
    }
    const todayStart = new Date(todayParams.startDate).getTime();
    const todayEnd = new Date(todayParams.endDate).getTime();
    const monthStart = new Date(monthParams.startDate).getTime();
    const monthEnd = new Date(monthParams.endDate).getTime();

    let todayCount = 0;
    let monthCount = 0;
    let todayAmount = 0;
    let monthAmount = 0;

    data.forEach((purchase) => {
      const createdAt = new Date(purchase.createdAt).getTime();
      const total = getPurchaseTotal(purchase);
      if (createdAt >= todayStart && createdAt <= todayEnd) {
        todayCount += 1;
        todayAmount += total;
      }
      if (createdAt >= monthStart && createdAt <= monthEnd) {
        monthCount += 1;
        monthAmount += total;
      }
    });

    return { todayCount, monthCount, todayAmount, monthAmount };
  }, [
    purchasesData?.data,
    todayParams.startDate,
    todayParams.endDate,
    monthParams.startDate,
    monthParams.endDate,
  ]);

  const getSaleTotal = (sale: Sale) => {
    const total = toNumber(sale?.total);
    if (total > 0) return total;
    const subtotal = (sale?.lines || []).reduce((sum, line) => {
      const lineTotal = toNumber(line.total);
      if (lineTotal > 0) return sum + lineTotal;
      return sum + toNumber(line.quantity) * toNumber(line.unitPrice) - toNumber(line.discount);
    }, 0);
    return subtotal - toNumber(sale?.discount) + toNumber(sale?.tax);
  };

  const salesStats = useMemo(() => {
    const data = salesData?.data || [];
    if (data.length === 0) {
      return { todayCount: 0, monthCount: 0, todayAmount: 0, monthAmount: 0 };
    }
    const todayStart = new Date(todayParams.startDate).getTime();
    const todayEnd = new Date(todayParams.endDate).getTime();
    const monthStart = new Date(monthParams.startDate).getTime();
    const monthEnd = new Date(monthParams.endDate).getTime();

    let todayCount = 0;
    let monthCount = 0;
    let todayAmount = 0;
    let monthAmount = 0;

    data.forEach((sale) => {
      const createdAt = new Date(sale.createdAt).getTime();
      const total = getSaleTotal(sale);
      if (createdAt >= todayStart && createdAt <= todayEnd) {
        todayCount += 1;
        todayAmount += total;
      }
      if (createdAt >= monthStart && createdAt <= monthEnd) {
        monthCount += 1;
        monthAmount += total;
      }
    });

    return { todayCount, monthCount, todayAmount, monthAmount };
  }, [
    salesData?.data,
    todayParams.startDate,
    todayParams.endDate,
    monthParams.startDate,
    monthParams.endDate,
  ]);

  const totalAvailableStock = useMemo(() => {
    return (productsData?.data || []).reduce((sum, product) => sum + getCurrentStock(product), 0);
  }, [productsData?.data, selectedDepotId]);

  const monthExpensesValue = useMemo(() => {
    return (monthExpensesData?.data || []).reduce(
      (sum, expense) => sum + toNumber(expense.amount),
      0
    );
  }, [monthExpensesData?.data]);

  const todaySalesValue = getPreferredMetric(dashboardData?.todaySales, salesStats.todayCount);
  const monthSalesValue = getPreferredMetric(dashboardData?.monthSales, salesStats.monthCount);
  const todayRevenueValue = getPreferredMetric(
    dashboardData?.todayRevenue,
    salesStats.todayAmount
  );
  const monthRevenueValue = getPreferredMetric(
    dashboardData?.monthRevenue,
    salesStats.monthAmount
  );
  const todayPurchaseAmount = getPreferredMetric(
    todaySummary?.totalPurchases,
    purchaseStats.todayAmount
  );
  const monthPurchaseAmount = getPreferredMetric(
    monthSummary?.totalPurchases,
    purchaseStats.monthAmount
  );
  const monthNetResult = monthRevenueValue - monthPurchaseAmount - monthExpensesValue;

  const chartData = statsTab === 'sales'
    ? [
        {
          label: 'Auj',
          value: todayRevenueValue,
        },
        {
          label: 'Mois',
          value: monthRevenueValue,
        },
      ]
    : [
        {
          label: 'Auj',
          value: todayPurchaseAmount,
        },
        {
          label: 'Mois',
          value: monthPurchaseAmount,
        },
      ];
  const maxChartValue = Math.max(...chartData.map((item) => item.value), 1);
  const chartHeight = 140;

  if (dashboardError) {
    const status = (dashboardError as any)?.response?.status;
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={
            status === 403
              ? "Accès interdit: vous n'avez pas les permissions pour la finance."
              : dashboardError?.message || 'Erreur lors du chargement du tableau de bord'
          }
          onRetry={status === 403 ? undefined : refetchDashboard}
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

        <View style={styles.filtersRow}>
          <View style={styles.filterItem}>
            <Text variant="bodySmall" style={styles.filterLabel}>
              Dépôt
            </Text>
            <Picker
              selectedValue={selectedDepotId || ''}
              onValueChange={(value) => setSelectedDepotId(value || null)}
              style={styles.filterPicker}
              itemStyle={styles.filterPickerItem}
            >
              <Picker.Item label="Tous" value="" />
              {depots?.data?.map((depot) => (
                <Picker.Item key={depot.id} label={depot.name} value={depot.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            {statsTab === 'sales' ? (
              <>
                <KPICard
                  title="Ventes du jour"
                  value={canViewFinance ? todaySalesValue : '—'}
                  icon="cart"
                  iconColor={theme.colors.primary}
                  subtitle={
                    canViewFinance ? formatCurrency(todayRevenueValue) : 'Accès limité'
                  }
                />
                <KPICard
                  title="Ventes du mois"
                  value={canViewFinance ? monthSalesValue : '—'}
                  icon="chart-bar"
                  iconColor={theme.colors.secondary}
                  subtitle={
                    canViewFinance ? formatCurrency(monthRevenueValue) : 'Accès limité'
                  }
                />
              </>
            ) : (
              <>
                <KPICard
                  title="Achats du jour"
                  value={canViewFinance ? purchaseStats.todayCount : '—'}
                  icon="truck-outline"
                  iconColor={theme.colors.primary}
                  subtitle={
                    canViewFinance ? formatCurrency(todayPurchaseAmount) : 'Accès limité'
                  }
                />
                <KPICard
                  title="Achats du mois"
                  value={canViewFinance ? purchaseStats.monthCount : '—'}
                  icon="warehouse"
                  iconColor={theme.colors.secondary}
                  subtitle={
                    canViewFinance ? formatCurrency(monthPurchaseAmount) : 'Accès limité'
                  }
                />
              </>
            )}
          </View>

          <View style={styles.kpiRow}>
            <KPICard
              title="Stock faible"
              value={lowStockProducts?.length ?? safeDashboard.lowStockCount}
              icon="alert-circle"
              iconColor={theme.colors.error}
              subtitle="Produits en alerte"
              onPress={() => router.push('/products?tab=low-stock')}
            />
            <KPICard
              title="Stock dispo"
              value={canViewFinance ? totalAvailableStock : '—'}
              icon="warehouse"
              iconColor="#FF9800"
              subtitle={canViewFinance ? 'Quantité totale disponible' : 'Accès limité'}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-line" size={18} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.sectionHeaderText}>
            {statsTab === 'sales' ? 'Aperçu ventes' : 'Aperçu achats'}
          </Text>
        </View>

        <SegmentedButtons
          value={statsTab}
          onValueChange={(value) => setStatsTab(value as 'sales' | 'purchases')}
          buttons={[
            { value: 'sales', label: 'Ventes', icon: 'cart' },
            { value: 'purchases', label: 'Achats', icon: 'truck-outline' },
          ]}
          style={styles.segmented}
        />

        {canViewFinance ? (
          <Card style={styles.chartCard}>
            <Card.Content>
              {isDashboardLoading ||
              isTodaySummaryLoading ||
              isMonthSummaryLoading ||
              isPurchasesLoading ||
              isSalesLoading ||
              isExpensesLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator />
                  <Text variant="bodyMedium" style={styles.loadingText}>
                    Chargement des stats...
                  </Text>
                </View>
              ) : (
                <View style={[styles.barChart, { width: chartWidth, height: chartHeight }]}>
                  {chartData.map((item) => (
                    <View key={item.label} style={styles.barItem}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max((item.value / maxChartValue) * chartHeight, 4),
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                      />
                      <Text variant="labelSmall" style={styles.barLabel}>
                        {item.label}
                      </Text>
                      <Text variant="labelSmall" style={styles.barValue}>
                        {formatCurrency(item.value)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.mutedText}>
                Accès limité aux statistiques financières.
              </Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="file-chart-outline" size={18} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.sectionHeaderText}>
            Résumé (Mois en cours)
          </Text>
        </View>

        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Ventes</Text>
              <Text variant="bodyMedium">{formatCurrency(monthRevenueValue)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Achats</Text>
              <Text variant="bodyMedium">{formatCurrency(monthPurchaseAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Dépenses</Text>
              <Text variant="bodyMedium">{formatCurrency(monthExpensesValue)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="titleSmall" style={styles.resultLabel}>
                Résultat
              </Text>
              <Text
                variant="titleSmall"
                style={[
                  styles.resultLabel,
                  { color: monthNetResult >= 0 ? theme.colors.primary : theme.colors.error },
                ]}
              >
                {formatCurrency(monthNetResult)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="alert" size={18} color={theme.colors.error} />
          <Text variant="titleMedium" style={styles.sectionHeaderText}>
            Alertes stock
          </Text>
        </View>

        {isLowStockLoading ? (
          <Card style={styles.alertCard}>
            <Card.Content style={styles.loadingRow}>
              <ActivityIndicator />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Chargement des alertes...
              </Text>
            </Card.Content>
          </Card>
        ) : lowStockProducts && lowStockProducts.length > 0 ? (
          <View style={styles.alertSection}>
            {lowStockProducts.slice(0, 5).map((product) => {
              const stockValue =
                stockByProductId.get(product.id) ?? getCurrentStock(product) ?? 0;
              return (
              <View
                key={product.id}
                style={[
                  styles.alertItem,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                  },
                ]}
              >
                <Text variant="bodyMedium" style={styles.productName}>
                  {product.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                  Stock: {stockValue} (Seuil: {product.minStock})
                </Text>
              </View>
              );
            })}
          </View>
        ) : (
          <Card style={styles.alertCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.mutedText}>
                Aucune alerte de stock pour le moment.
              </Text>
            </Card.Content>
          </Card>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeaderText: {
    marginLeft: Spacing.sm,
    fontWeight: 'bold',
  },
  segmented: {
    marginBottom: Spacing.md,
  },
  filtersRow: {
    marginBottom: Spacing.md,
  },
  filterItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    borderColor: 'transparent',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  filterLabel: {
    marginLeft: Spacing.xs,
    opacity: 0.7,
  },
  filterPicker: {
    height: 36,
  },
  filterPickerItem: {
    height: 36,
    fontSize: 12,
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
  chartCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    borderColor: 'transparent',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    borderColor: 'transparent',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  alertItem: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: Spacing.sm,
    opacity: 0.8,
  },
  mutedText: {
    opacity: 0.7,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 28,
    borderRadius: 8,
  },
  barLabel: {
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  barValue: {
    marginTop: 2,
    fontSize: 10,
    opacity: 0.8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  resultLabel: {
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
});
