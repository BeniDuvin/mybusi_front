import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';
import { useStoreAccess } from '@/hooks/useStoreAccess';

const labels: Record<string, string> = { TRIAL: 'Essai gratuit', ACTIVE: 'Actif', GRACE_PERIOD: 'Période de grâce', EXPIRED: 'Expiré', SUSPENDED: 'Suspendu', CANCELLED: 'Résilié' };

export default function SubscriptionScreen() {
  const theme = useTheme();
  const { store, subscription, subscriptionQuery, isOwner, daysRemaining } = useStoreAccess();
  if (subscriptionQuery.isLoading) return <SafeAreaView style={styles.center}><ActivityIndicator /></SafeAreaView>;
  if (subscriptionQuery.isError || !subscription) return <SafeAreaView style={styles.center}><Text>Abonnement indisponible pour cette boutique.</Text></SafeAreaView>;
  return <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}><ScrollView contentContainerStyle={styles.content}>
    <Text variant="headlineSmall" style={styles.title}>Abonnement · {store?.name || 'Boutique'}</Text>
    <Card><Card.Content>
      <Text variant="titleLarge">{subscription.planCode}</Text>
      <Text>Tarif prévu : 2 500 FCFA / mois</Text>
      <Text>Statut : {labels[subscription.status] || subscription.status}</Text>
      <Text>Fin de période : {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</Text>
      <Text>{daysRemaining} jour(s) restant(s)</Text>
      {!isOwner && <Text style={styles.note}>Seul le propriétaire de la boutique peut gérer son abonnement.</Text>}
      {!['TRIAL', 'ACTIVE'].includes(subscription.status) && <Text style={styles.note}>La boutique est en lecture seule tant que l’abonnement n’est pas actif.</Text>}
      {isOwner && <>
        <Text style={styles.note}>Le paiement K-Pay n’est pas encore activé sur le serveur. Aucun débit ne sera lancé depuis cette version.</Text>
        <Button mode="contained" disabled style={styles.payButton}>Paiement K-Pay indisponible</Button>
      </>}
    </Card.Content></Card>
    <Text variant="titleMedium" style={styles.section}>Historique des paiements</Text>
    {!subscription.payments?.length ? <Text>Aucun paiement enregistré.</Text> : subscription.payments.map((payment) => <Card key={payment.id} style={styles.payment}><Card.Content><View style={styles.row}><Text>{payment.status}</Text><Text>{payment.amount} {payment.currency}</Text></View><Text>{new Date(payment.createdAt).toLocaleDateString()}</Text></Card.Content></Card>)}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: Spacing.md, paddingBottom: 48 }, title: { fontWeight: 'bold', marginBottom: Spacing.lg }, section: { marginTop: Spacing.xl, marginBottom: Spacing.md }, payment: { marginBottom: Spacing.sm }, row: { flexDirection: 'row', justifyContent: 'space-between' }, note: { marginTop: Spacing.md, opacity: 0.75 }, payButton: { marginTop: Spacing.md } });
