import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFinanceSummary } from '@/hooks/useFinance';
import { useAppStore } from '@/stores/app.store';
import { formatCurrency } from '@/utils/format';
import { Spacing } from '@/constants/theme';

export default function FinanceHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedDepotId } = useAppStore();
  const { data: summary } = useFinanceSummary({ depotId: selectedDepotId || undefined });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>
        Finance
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Résumé
          </Text>
          <View style={styles.row}>
            <Text variant="bodyMedium">Ventes</Text>
            <Text variant="bodyMedium">{formatCurrency(summary?.totalSales || 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodyMedium">Achats</Text>
            <Text variant="bodyMedium">{formatCurrency(summary?.totalPurchases || 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodyMedium">Dépenses</Text>
            <Text variant="bodyMedium">{formatCurrency(summary?.totalExpenses || 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodyMedium">Salaires</Text>
            <Text variant="bodyMedium">{formatCurrency(summary?.totalSalaries || 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="titleSmall" style={styles.bold}>
              Résultat
            </Text>
            <Text variant="titleSmall" style={[styles.bold, { color: theme.colors.primary }]}>
              {formatCurrency(summary?.netProfit || 0)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button mode="contained" onPress={() => router.push('/finance/expenses')}>
          Dépenses
        </Button>
        <Button mode="outlined" onPress={() => router.push('/finance/salaries')}>
          Salaires
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  bold: {
    fontWeight: 'bold',
  },
  actions: {
    gap: Spacing.sm,
  },
});
