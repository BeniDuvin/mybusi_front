import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';
import { depotService } from '@/services/depot.service';
import { useAppStore } from '@/stores/app.store';

export default function StoreOnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setSelectedDepotId = useAppStore((state) => state.setSelectedDepotId);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Creates the first tenant, then persists it as the active store for API scoping.
  const createStore = async () => {
    if (!name.trim() || !address.trim() || !phone.trim()) return setError('Nom, adresse et téléphone sont obligatoires.');
    setLoading(true);
    try {
      const store = await depotService.create({ name: name.trim(), address: address.trim(), phone: phone.trim(), email: email.trim() || undefined });
      setSelectedDepotId(store.id);
      router.replace('/(main)/dashboard');
    } catch {
      setError('Création impossible. Vérifiez les informations et réessayez.');
    } finally { setLoading(false); }
  };

  return <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium">Créez votre espace MyBusi</Text>
        <Text style={styles.hint}>Les informations de la boutique sont nécessaires pour démarrer.</Text>
        <View>
          <TextInput label="Nom de la boutique" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Adresse" value={address} onChangeText={setAddress} mode="outlined" style={styles.input} />
          <TextInput label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" mode="outlined" style={styles.input} />
          <TextInput label="Email (facultatif)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={createStore} loading={loading} disabled={loading}>Créer ma boutique</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <Snackbar visible={!!error} onDismiss={() => setError('')}>{error}</Snackbar>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl }, hint: { marginVertical: Spacing.md }, input: { marginBottom: Spacing.md } });
