import { Spacing } from '@/constants/theme';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { usePurchase, useUpdatePurchase } from '@/hooks/usePurchases';
import type { CreatePurchaseRequest } from '@/types';
import { PURCHASE_STATUS_LABELS } from '@/utils/constants';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { invoiceService } from '@/services/invoice.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Divider,
    Snackbar,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { stockService } from '@/services/stock.service';

export default function EditPurchaseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { canManageStore: canManage } = useStoreAccess();

  React.useEffect(() => {
    if (!canManage) {
      router.replace('/purchases');
    }
  }, [canManage, router]);
  const { data: purchase, isLoading } = usePurchase(id || '');
  const updateMutation = useUpdatePurchase();

  const [formData, setFormData] = useState<Partial<CreatePurchaseRequest>>({
    notes: '',
    deliveryDate: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!purchase) return;
    setFormData({
      notes: purchase.notes || '',
      deliveryDate: purchase.deliveryDate || new Date().toISOString().split('T')[0],
    });
  }, [purchase]);

  const toNumber = (value?: number) =>
    typeof value === 'number' && !Number.isNaN(value) ? value : 0;

  type PurchaseLine = NonNullable<typeof purchase>['lines'][number];

  const depotId = purchase?.depotId;
  const { data: stockData } = useQuery({
    queryKey: ['stock', 'depot', depotId],
    queryFn: () => stockService.getByDepot(depotId as string, { limit: 1000 }),
    enabled: !!depotId,
  });

  const stockByProductId = React.useMemo(() => {
    const map = new Map<string, number>();
    stockData?.data?.forEach((stock) => {
      map.set(stock.productId, stock.quantity ?? 0);
    });
    return map;
  }, [stockData?.data]);

  const getLineTotal = (line: PurchaseLine) => {
    const lineTotal = toNumber(line.total);
    if (lineTotal > 0) return lineTotal;
    return toNumber(line.quantity) * toNumber(line.unitPrice);
  };

  const getPurchaseTotal = () => {
    if (!purchase) return 0;
    const total = toNumber(purchase.total);
    if (total > 0) return total;
    return (purchase.lines || []).reduce((sum, line) => sum + getLineTotal(line), 0);
  };

  const handlePrintReceipt = async () => {
    if (!purchase) return;
    try {
      const total = getPurchaseTotal();
      const remaining = Math.max(total - toNumber(purchase.paidAmount), 0);
      const linesHtml = (purchase.lines || [])
        .map((line) => {
          const name = line.product?.name || 'Produit';
          const qty = toNumber(line.quantity);
          const unitPrice = toNumber(line.unitPrice);
          const lineTotal = getLineTotal(line);
          return `
            <tr>
              <td style="padding:6px 0;">${name}</td>
              <td style="padding:6px 0; text-align:right;">${qty}</td>
              <td style="padding:6px 0; text-align:right;">${formatCurrency(unitPrice)}</td>
              <td style="padding:6px 0; text-align:right;">${formatCurrency(lineTotal)}</td>
            </tr>
          `;
        })
        .join('');

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="font-family: Arial, sans-serif; color: #0f172a; padding: 16px;">
            <h2 style="margin:0 0 8px;">Bon de caisse - Achat</h2>
            <p style="margin:0 0 4px;">Réf: ${purchase.id.slice(0, 6).toUpperCase()}</p>
            <p style="margin:0 0 4px;">Date: ${formatDateTime(purchase.createdAt)}</p>
            <p style="margin:0 0 4px;">Fournisseur: ${purchase.supplier?.name || purchase.supplierId}</p>
            <p style="margin:0 0 12px;">Dépôt: ${purchase.depot?.name || purchase.depotId}</p>

            <table style="width:100%; border-collapse:collapse; font-size: 12px;">
              <thead>
                <tr>
                  <th style="text-align:left; border-bottom:1px solid #cbd5f5; padding-bottom:6px;">Produit</th>
                  <th style="text-align:right; border-bottom:1px solid #cbd5f5; padding-bottom:6px;">Qté</th>
                  <th style="text-align:right; border-bottom:1px solid #cbd5f5; padding-bottom:6px;">PU</th>
                  <th style="text-align:right; border-bottom:1px solid #cbd5f5; padding-bottom:6px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${linesHtml}
              </tbody>
            </table>

            <div style="margin-top: 16px;">
              <p style="margin:4px 0;">Total: <strong>${formatCurrency(total)}</strong></p>
              <p style="margin:4px 0;">Payé: <strong>${formatCurrency(toNumber(purchase.paidAmount))}</strong></p>
              <p style="margin:4px 0;">Reste: <strong>${formatCurrency(remaining)}</strong></p>
            </div>

            <div style="margin-top: 24px;">
              <p style="margin-bottom: 8px;">Signature du fournisseur :</p>
              <div style="border-bottom: 1px solid #0f172a; height: 40px;"></div>
            </div>
          </body>
        </html>
      `;
      await invoiceService.printHtml(html);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'impression');
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      setSuccess('Achat mis à jour');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/purchases');
        }
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Modifier l'achat
          </Text>

          {purchase && (
            <Card style={styles.summaryCard}>
              <Card.Content>
                <View style={styles.summaryHeader}>
                  <Text variant="titleMedium" style={styles.summaryTitle}>
                    Achat {purchase.id.slice(0, 6).toUpperCase()}
                  </Text>
                  <Chip style={styles.statusChip} textStyle={styles.statusText}>
                    {PURCHASE_STATUS_LABELS[purchase.status] || purchase.status}
                  </Chip>
                </View>

                <Text variant="bodySmall" style={styles.summaryMeta}>
                  {formatDateTime(purchase.createdAt)}
                </Text>
                <Text variant="bodySmall" style={styles.summaryMeta}>
                  Fournisseur: {purchase.supplier?.name || purchase.supplierId}
                </Text>
                <Text variant="bodySmall" style={styles.summaryMeta}>
                  Dépôt: {purchase.depot?.name || purchase.depotId}
                </Text>

                <Divider style={styles.divider} />

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      Total
                    </Text>
                    <Text variant="titleSmall" style={styles.summaryValue}>
                      {formatCurrency(getPurchaseTotal())}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      Payé
                    </Text>
                    <Text variant="titleSmall" style={styles.summaryValue}>
                      {formatCurrency(toNumber(purchase.paidAmount))}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text variant="bodySmall" style={styles.summaryLabel}>
                      Reste
                    </Text>
                    <Text
                      variant="titleSmall"
                      style={[styles.summaryValue, { color: theme.colors.error }]}
                    >
                      {formatCurrency(
                        Math.max(getPurchaseTotal() - toNumber(purchase.paidAmount), 0)
                      )}
                    </Text>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Lignes d'achat
                </Text>
                {purchase.lines?.map((line) => (
                  <View key={line.id} style={styles.lineRow}>
                    <View style={styles.lineInfo}>
                      <Text variant="bodyMedium">{line.product?.name || 'Produit'}</Text>
                      <Text variant="bodySmall" style={styles.lineMeta}>
                        {line.quantity} x {formatCurrency(line.unitPrice)}
                      </Text>
                      <Text variant="bodySmall" style={styles.lineMeta}>
                        Stock dépôt: {stockByProductId.get(line.productId) ?? 0}
                      </Text>
                    </View>
                    <Text variant="bodyMedium" style={styles.lineTotal}>
                      {formatCurrency(getLineTotal(line))}
                    </Text>
                  </View>
                ))}

                <Button
                  mode="outlined"
                  icon="printer"
                  onPress={handlePrintReceipt}
                  style={styles.printButton}
                >
                  Imprimer le bon de caisse
                </Button>
              </Card.Content>
            </Card>
          )}

          <TextInput
            label="Notes"
            value={formData.notes || ''}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Date de livraison"
            value={formData.deliveryDate || ''}
            mode="outlined"
            style={[styles.input, styles.readonlyInput]}
            disabled
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            style={styles.submitButton}
          >
            Enregistrer
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={3000}>
        {success}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  summaryCard: {
    marginBottom: Spacing.lg,
    borderRadius: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: Spacing.sm,
  },
  summaryMeta: {
    opacity: 0.7,
    marginTop: Spacing.xs,
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
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  lineInfo: {
    flex: 1,
  },
  lineMeta: {
    opacity: 0.6,
  },
  lineTotal: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: Spacing.sm,
  },
  printButton: {
    marginTop: Spacing.md,
  },
  statusChip: {
    borderRadius: 999,
    backgroundColor: '#E0E0E0',
  },
  statusText: {
    fontWeight: '600',
  },
  input: {
    marginBottom: Spacing.md,
  },
  readonlyInput: {
    opacity: 0.7,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
