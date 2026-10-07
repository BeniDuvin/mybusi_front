import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { isValidEmail } from '@/utils/validation';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const logo = require('../../assets/images/icon.png');

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('Veuillez entrer votre email');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email invalide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset({ email: email.trim().toLowerCase() });
      router.replace({ pathname: '/reset-password', params: { email: email.trim().toLowerCase() } });
      setSuccess('Si cette adresse correspond à un compte, un code de vérification a été envoyé.');
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Échec de la réinitialisation'
      );
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
              Mot de passe oublié
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Entrez votre email pour recevoir un lien de réinitialisation
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
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={styles.resetButton}
            >
              Réinitialiser le mot de passe
            </Button>

            <View style={styles.loginContainer}>
              <Text variant="bodyMedium">Vous vous souvenez ? </Text>
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
  resetButton: {
    marginBottom: Spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
