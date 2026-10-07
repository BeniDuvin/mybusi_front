import React, { useState, useEffect, useCallback } from 'react';
import { Image, StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, useTheme, Snackbar } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { isValidPhone, normalizePhone } from '@/utils/validation';

const logo = require('../../assets/images/icon.png');
const RESEND_COOLDOWN_SEC = 60;

/** Messages utilisateur - évite d'exposer les erreurs techniques (ex. OTP_MOCK, service SMS) */
const USER_MESSAGES = {
  sendFailed: "Envoi du code impossible. Réessayez plus tard.",
  verifyFailed: "Code invalide ou expiré. Vérifiez le code ou renvoyez-en un nouveau.",
};

export default function OTPVerificationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn } = useAuthContext();

  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSendOTP = useCallback(async () => {
    if (!phone) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (!isValidPhone(phone)) {
      setError('Numéro de téléphone invalide (ex: +242 06 123 45 67)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalized = normalizePhone(phone);
      await authService.sendOTP({ phone: normalized });
      setSuccess('Code OTP envoyé avec succès');
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err: any) {
      if (__DEV__) {
        console.warn('[OTP] send error:', err?.response?.data || err?.message);
      }
      setError(USER_MESSAGES.sendFailed);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      setError('Veuillez entrer le code OTP');
      return;
    }

    if (otpCode.length !== 6) {
      setError('Le code OTP doit contenir 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalized = normalizePhone(phone);
      const response = await authService.verifyOTP({ phone: normalized, otpCode });
      await signIn(response.accessToken, response.refreshToken, response.user);
      router.replace(response.user.mustChangePassword ? '/(main)/force-change-password' : '/(main)/dashboard');
    } catch (err: any) {
      if (__DEV__) {
        console.warn('[OTP] verify error:', err?.response?.data || err?.message);
      }
      setError(USER_MESSAGES.verifyFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text variant="headlineMedium" style={styles.title}>
              Connexion par SMS
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {step === 'phone'
                ? 'Entrez votre numéro de téléphone'
                : 'Entrez le code reçu par SMS'}
            </Text>
          </View>

          <View
            style={[
              styles.form,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            {step === 'phone' ? (
              <>
                <TextInput
                  label="Numéro de téléphone"
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  placeholder="+242 XX XXX XX XX"
                  style={styles.input}
                  left={<TextInput.Icon icon="phone" />}
                />

                <Button
                  mode="contained"
                  onPress={handleSendOTP}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Envoyer le code
                </Button>
              </>
            ) : (
              <>
                <TextInput
                  label="Code OTP"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  mode="outlined"
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="123456"
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                />

                <Button
                  mode="contained"
                  onPress={handleVerifyOTP}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Vérifier le code
                </Button>

                <Button
                  mode="text"
                  onPress={handleSendOTP}
                  disabled={resendCooldown > 0 || loading}
                  style={styles.resendButton}
                >
                  {resendCooldown > 0
                    ? `Renvoyer dans ${resendCooldown}s`
                    : 'Renvoyer le code'}
                </Button>

                <Button
                  mode="text"
                  onPress={() => {
                    setStep('phone');
                    setOtpCode('');
                    setResendCooldown(0);
                  }}
                  style={styles.backButton}
                >
                  Changer de numéro
                </Button>
              </>
            )}

            <View style={styles.loginContainer}>
              <Text variant="bodyMedium">Vous préférez l'email ? </Text>
              <Link href="/login" asChild>
                <Button mode="text" compact>
                  Se connecter
                </Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
      >
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    opacity: 0.7,
  },
  form: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.small,
  },
  input: {
    marginBottom: Spacing.md,
  },
  button: {
    marginBottom: Spacing.lg,
  },
  resendButton: {
    marginBottom: Spacing.sm,
  },
  backButton: {
    marginBottom: Spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
