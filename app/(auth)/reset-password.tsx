import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { isStrongPassword, isValidEmail } from '@/utils/validation';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(Array.isArray(params.email) ? params.email[0] : params.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resets credentials only after the server validates the email OTP.
  const resetPassword = async () => {
    if (!isValidEmail(email) || !/^\d{6}$/.test(otpCode)) return setError('Email ou code invalide.');
    if (!isStrongPassword(password)) return setError('Utilisez 8 caractères avec majuscule, minuscule et chiffre.');
    if (password !== confirmPassword) return setError('Les mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      await authService.resetPassword({ email: email.trim().toLowerCase(), otpCode, newPassword: password, confirmPassword });
      setSuccess('Mot de passe modifié. Vous pouvez vous connecter.');
      setTimeout(() => router.replace('/login'), 1200);
    } catch {
      setError('Code invalide ou expiré. Demandez un nouveau code si nécessaire.');
    } finally { setLoading(false); }
  };

  return <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium">Nouveau mot de passe</Text>
        <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={styles.input} />
        <TextInput label="Code reçu par email" value={otpCode} onChangeText={(value) => setOtpCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} mode="outlined" style={styles.input} />
        <TextInput label="Nouveau mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" mode="outlined" style={styles.input} />
        <TextInput label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" mode="outlined" style={styles.input} />
        <Button mode="contained" onPress={resetPassword} loading={loading} disabled={loading}>Réinitialiser</Button>
        <View style={styles.back}><Button onPress={() => router.replace('/forgot-password')}>Demander un nouveau code</Button></View>
      </ScrollView>
    </KeyboardAvoidingView>
    <Snackbar visible={!!error} onDismiss={() => setError('')}>{error}</Snackbar>
    <Snackbar visible={!!success} onDismiss={() => setSuccess('')}>{success}</Snackbar>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl }, input: { marginVertical: Spacing.sm }, back: { marginTop: Spacing.md } });
