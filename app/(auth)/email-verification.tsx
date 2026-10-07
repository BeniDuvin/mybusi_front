import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { isValidEmail } from '@/utils/validation';

export default function EmailVerificationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = Array.isArray(params.email) ? params.email[0] : params.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { signIn } = useAuthContext();

  // Vérifie le compte auprès du serveur avant de créer la session locale.
  const verify = async () => {
    if (!isValidEmail(email) || !/^\d{6}$/.test(otpCode)) return setError('Saisissez un email valide et le code à six chiffres.');
    setLoading(true);
    try {
      const session = await authService.verifyEmail({ email: email.trim().toLowerCase(), otpCode });
      await signIn(session.accessToken, session.refreshToken, session.user);
      router.replace(session.user.mustChangePassword ? '/(main)/force-change-password' : '/(main)/dashboard');
    } catch {
      setError('Code invalide ou expiré. Vérifiez le code puis réessayez.');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (!isValidEmail(email)) return setError('Saisissez une adresse email valide.');
    setLoading(true);
    try { const result = await authService.resendEmailOtp(email.trim().toLowerCase()); setNotice(result.message); }
    catch { setError('Impossible de renvoyer le code pour le moment.'); }
    finally { setLoading(false); }
  };

  return <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <View style={styles.content}>
      <Text variant="headlineMedium">Vérifiez votre email</Text>
      <Text style={styles.hint}>Saisissez le code envoyé à votre adresse.</Text>
      <TextInput label="Adresse email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={styles.input} />
      <TextInput label="Code à six chiffres" value={otpCode} onChangeText={(value) => setOtpCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} mode="outlined" style={styles.input} />
      <Button mode="contained" onPress={verify} loading={loading} disabled={loading}>Vérifier et continuer</Button>
      <Button onPress={resend} disabled={loading}>Renvoyer le code</Button>
    </View>
    <Snackbar visible={!!error} onDismiss={() => setError('')}>{error}</Snackbar>
    <Snackbar visible={!!notice} onDismiss={() => setNotice('')}>{notice}</Snackbar>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { flex: 1, justifyContent: 'center', padding: Spacing.xl }, hint: { marginVertical: Spacing.md }, input: { marginBottom: Spacing.md } });
