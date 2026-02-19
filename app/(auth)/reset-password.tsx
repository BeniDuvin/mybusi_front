import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { isStrongPassword } from '@/utils/validation';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const logo = require('../../assets/images/icon.png');

const PASSWORD_HINT =
  'Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resolvedToken = Array.isArray(token) ? token[0] : token;

  const handleReset = async () => {
    if (!resolvedToken?.trim()) {
      setError('Lien invalide ou expiré. Veuillez demander un nouveau lien.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setError(PASSWORD_HINT);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword({
        token: resolvedToken.trim(),
        newPassword,
      });
      setSuccess('Mot de passe modifié. Vous pouvez vous connecter.');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Échec de la réinitialisation. Le lien a peut-être expiré.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!resolvedToken?.trim()) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text variant="headlineMedium" style={styles.title}>
              Lien invalide
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.
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
            <Link href="/forgot-password" asChild>
              <Button mode="contained" style={styles.resetButton}>
                Nouveau lien
              </Button>
            </Link>
            <Link href="/login" asChild>
              <Button mode="outlined" style={styles.backButton}>
                Retour connexion
              </Button>
            </Link>
          </View>
        </ScrollView>
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
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text variant="headlineMedium" style={styles.title}>
              Nouveau mot de passe
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Choisissez un nouveau mot de passe sécurisé
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
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder={PASSWORD_HINT}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
            />

            <Button
              mode="contained"
              onPress={handleReset}
              loading={loading}
              disabled={loading}
              style={styles.resetButton}
            >
              Réinitialiser
            </Button>

            <View style={styles.loginContainer}>
              <Link href="/login" asChild>
                <Button mode="text" compact>
                  Retour à la connexion
                </Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={4000}
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
    textAlign: 'center',
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
    marginBottom: Spacing.md,
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
