import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import type { Role, User } from '@/types';
import { TEST_CREDENTIALS, type TestCredentialKey } from '@/utils/test-credentials';
import { isValidEmail } from '@/utils/validation';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const logo = require('../../assets/images/icon.png');

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn } = useAuthContext();
  const enableTestLogin = process.env.EXPO_PUBLIC_ENABLE_TEST_LOGIN === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);

  const handleLogin = async (testEmail?: string, testPassword?: string) => {
    const loginEmail = testEmail || email;
    const loginPassword = testPassword || password;

    const testAccount = Object.values(TEST_CREDENTIALS).find(
      (credential) =>
        credential.email === loginEmail && credential.password === loginPassword
    );

    // Validation
    if (!loginEmail || !loginPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setError('Email invalide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (testAccount && enableTestLogin) {
        const now = new Date().toISOString();
        const mockUser: User = {
          id: `test-${testAccount.role.toLowerCase()}`,
          email: testAccount.email,
          phone: '+0000000000',
          firstName: testAccount.label,
          lastName: 'Test',
          role: testAccount.role as Role,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        await signIn('test-access-token', 'test-refresh-token', mockUser);
        router.replace('/(main)/dashboard');
        return;
      }

      const response = await authService.login({ email: loginEmail, password: loginPassword });
      await signIn(response.accessToken, response.refreshToken, response.user);
      router.replace('/(main)/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = (credentialKey: TestCredentialKey) => {
    const credentials = TEST_CREDENTIALS[credentialKey];
    setShowTestDialog(false);
    handleLogin(credentials.email, credentials.password);
  };

  const handleUseTestAccount = (credentialKey: TestCredentialKey) => {
    const credentials = TEST_CREDENTIALS[credentialKey];
    setEmail(credentials.email);
    setPassword(credentials.password);
    handleLogin(credentials.email, credentials.password);
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
            <Text variant="titleMedium" style={styles.subtitle}>
              Logiciel de gestion commerciale
            </Text>
            <Text variant="bodySmall" style={styles.country}>
              🇨🇬 Congo Brazzaville
            </Text>
          </View>

          {enableTestLogin && (
            <View style={styles.testAccountsSection}>
              <Text variant="bodySmall" style={styles.testHint}>
                Accès rapide aux interfaces par rôle
              </Text>
              <Button
                mode="outlined"
                icon="test-tube"
                onPress={() => setShowTestDialog(true)}
                style={styles.testButton}
              >
                Connexion test
              </Button>
              <View style={styles.testQuickList}>
                {Object.entries(TEST_CREDENTIALS).map(([key, cred]) => (
                  <Chip
                    key={key}
                    mode="outlined"
                    onPress={() => handleUseTestAccount(key as TestCredentialKey)}
                    style={styles.testChip}
                  >
                    {cred.label}
                  </Chip>
                ))}
              </View>
            </View>
          )}

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

            <TextInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {/* <Link href="/forgot-password" asChild>
              <Button mode="text" style={styles.forgotButton}>
                Mot de passe oublié ?
              </Button>
            </Link> */}

            <Button
              mode="contained"
              onPress={() => handleLogin()}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            >
              Se connecter
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="bodySmall" style={styles.dividerText}>
                OU
              </Text>
              <View style={styles.dividerLine} />
            </View>

            {/* <Link href="/otp-verification" asChild>
              <Button mode="outlined" icon="phone" style={styles.otpButton}>
                Se connecter par SMS
              </Button>
            </Link> */}

            <View style={styles.registerContainer}>
              <Text variant="bodyMedium">Pas de compte ? </Text>
              <Link href="/register" asChild>
                <Button mode="text" compact>
                  S'inscrire
                </Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={showTestDialog} onDismiss={() => setShowTestDialog(false)}>
          <Dialog.Title>Comptes de test</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogDescription}>
              Sélectionnez un compte pour vous connecter rapidement :
            </Text>
            
            {Object.entries(TEST_CREDENTIALS).map(([key, cred]) => (
              <Chip
                key={key}
                mode="outlined"
                onPress={() => handleTestLogin(key as TestCredentialKey)}
                style={styles.testChip}
              >
                {cred.label} - {cred.email}
              </Chip>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTestDialog(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    opacity: 0.7,
  },
  country: {
    marginTop: Spacing.xs,
    opacity: 0.5,
  },
  testAccountsSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  testHint: {
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  testButton: {
    borderStyle: 'dashed',
  },
  testQuickList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.sm,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
  },
  loginButton: {
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    opacity: 0.5,
  },
  otpButton: {
    marginBottom: Spacing.lg,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogDescription: {
    marginBottom: Spacing.md,
  },
  testChip: {
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
});
