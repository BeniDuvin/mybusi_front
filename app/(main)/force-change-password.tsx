import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { isStrongPassword } from '@/utils/validation';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Forces invited users to replace the shared temporary credential before using store data. */
export default function ForceChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { refreshUser } = useAuthContext();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!isStrongPassword(password)) {
      setError('Utilisez au moins 8 caractères, une majuscule, une minuscule et un chiffre.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({ newPassword: password });
      await refreshUser();
      router.replace('/dashboard');
    } catch {
      setError('Impossible de modifier le mot de passe. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text variant="headlineSmall" style={styles.title}>Sécurisez votre compte</Text>
            <Text style={styles.description}>
              Votre mot de passe temporaire doit être remplacé avant d’accéder à la boutique.
            </Text>
            <TextInput
              label="Nouveau mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Confirmer le mot de passe"
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
            />
            <Button mode="text" onPress={() => setShowPassword((visible) => !visible)}>
              {showPassword ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
            </Button>
            <Text style={styles.hint}>8 caractères minimum, avec majuscule, minuscule et chiffre.</Text>
            <Button mode="contained" onPress={submit} loading={loading} disabled={loading}>
              Enregistrer et continuer
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar visible={!!error} onDismiss={() => setError('')}>{error}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  form: { gap: Spacing.md },
  title: { fontWeight: 'bold' },
  description: { marginBottom: Spacing.sm },
  input: { marginBottom: Spacing.xs },
  hint: { marginBottom: Spacing.md, opacity: 0.75 },
});
