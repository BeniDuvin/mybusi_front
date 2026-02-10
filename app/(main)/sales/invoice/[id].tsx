import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Card, Text, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useSale } from '@/hooks/useSales';
import { invoiceService } from '@/services/invoice.service';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Spacing } from '@/constants/theme';

export default function SaleInvoiceScreen() {
  const theme = useTheme();
  const { id, autoPrint, format } = useLocalSearchParams<{
    id: string;
    autoPrint?: string;
    format?: 'A4' | '58mm' | '80mm';
  }>();
  const { data: sale, isLoading } = useSale(id || '');
  const [error, setError] = useState('');
  const [loadingFormat, setLoadingFormat] = useState<'A4' | '58mm' | '80mm' | null>(null);

  const toNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getLineTotal = (line: NonNullable<typeof sale>['lines'][number]) => {
    const lineTotal = toNumber(line.total);
    if (lineTotal > 0) return lineTotal;
    return toNumber(line.quantity) * toNumber(line.unitPrice) - toNumber(line.discount);
  };

  const getSubtotal = () => {
    if (!sale) return 0;
    const subtotal = toNumber(sale.subtotal);
    if (subtotal > 0) return subtotal;
    return (sale.lines || []).reduce((sum, line) => sum + getLineTotal(line), 0);
  };

  const getTotal = () => {
    if (!sale) return 0;
    const total = toNumber(sale.total);
    if (total > 0) return total;
    return getSubtotal() - toNumber(sale.discount) + toNumber(sale.tax);
  };

  const handleGenerate = async (format: 'A4' | '58mm' | '80mm') => {
    if (!id) return;
    setLoadingFormat(format);
    try {
      const uri = await invoiceService.generate(id, format);
      try {
        await invoiceService.printFile(uri);
      } catch (printError) {
        await invoiceService.share(uri);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la génération');
    } finally {
      setLoadingFormat(null);
    }
  };

  const getClientNameFromNotes = (note?: string) => {
    if (!note) return '';
    const match = note.match(/Client:\s*([^|]+)/i);
    return match?.[1]?.trim() || '';
  };

  React.useEffect(() => {
    if (autoPrint === '1') {
      handleGenerate(format || '58mm');
    }
  }, [autoPrint, format, id]);

  if (isLoading || !sale) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          Facture {sale.invoiceNumber}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.meta}>
              Date: {formatDateTime(sale.createdAt)}
            </Text>
            {sale.client && (
              <Text variant="bodySmall" style={styles.meta}>
                Client: {sale.client.firstName} {sale.client.lastName}
              </Text>
            )}
            {!sale.client && getClientNameFromNotes(sale.notes) ? (
              <Text variant="bodySmall" style={styles.meta}>
                Client: {getClientNameFromNotes(sale.notes)}
              </Text>
            ) : null}
            {sale.user && (
              <Text variant="bodySmall" style={styles.meta}>
                Agent: {sale.user.firstName} {sale.user.lastName}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.meta}>
              Statut: {sale.status}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Articles
            </Text>
            {sale.lines.map((line) => (
              <View key={line.id} style={styles.lineItem}>
                <View style={styles.lineInfo}>
                  <Text variant="bodyMedium">{line.product?.name || 'Produit'}</Text>
                  <Text variant="bodySmall" style={styles.lineQty}>
                    {line.quantity} x {formatCurrency(line.unitPrice)}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.lineTotal}>
                  {formatCurrency(getLineTotal(line))}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.totalRow}>
              <Text variant="bodyMedium">Sous-total</Text>
              <Text variant="bodyMedium">{formatCurrency(getSubtotal())}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text variant="bodyMedium">Remise</Text>
              <Text variant="bodyMedium">{formatCurrency(toNumber(sale.discount))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text variant="bodyMedium">Taxe</Text>
              <Text variant="bodyMedium">{formatCurrency(toNumber(sale.tax))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text variant="titleMedium" style={styles.totalLabel}>
                Total
              </Text>
              <Text variant="titleMedium" style={[styles.totalLabel, { color: theme.colors.primary }]}>
                {formatCurrency(getTotal())}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Exporter la facture
        </Text>
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => handleGenerate('A4')}
            loading={loadingFormat === 'A4'}
            style={styles.actionButton}
          >
            A4 PDF
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleGenerate('80mm')}
            loading={loadingFormat === '80mm'}
            style={styles.actionButton}
          >
            80mm
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleGenerate('58mm')}
            loading={loadingFormat === '58mm'}
            style={styles.actionButton}
          >
            58mm
          </Button>
        </View>
      </ScrollView>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
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
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.md,
  },
  meta: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
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
  lineQty: {
    opacity: 0.6,
  },
  lineTotal: {
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
