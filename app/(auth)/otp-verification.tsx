import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, useTheme, Snackbar } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { isValidPhone } from '@/utils/validation';

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

  const handleSendOTP = async () => {
    if (!phone) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (!isValidPhone(phone)) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.sendOTP({ phone });
      setSuccess('Code OTP envoyé avec succès');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || "Échec de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

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
      const response = await authService.verifyOTP({ phone, otpCode });
      await signIn(response.accessToken, response.refreshToken, response.user);
      router.replace('/(main)/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code OTP invalide');
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

                <Button mode="text" onPress={handleSendOTP} style={styles.resendButton}>
                  Renvoyer le code
                </Button>

                <Button
                  mode="text"
                  onPress={() => {
                    setStep('phone');
                    setOtpCode('');
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
    marginBottom: Spacing.xl,
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
