import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, useTheme, Snackbar, Chip, Portal, Dialog } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Spacing } from '@/constants/theme';
import { isValidEmail } from '@/utils/validation';
import { TEST_CREDENTIALS, type TestCredentialKey } from '@/utils/test-credentials';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);

  const handleLogin = async (testEmail?: string, testPassword?: string) => {
    const loginEmail = testEmail || email;
    const loginPassword = testPassword || password;

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.title}>
              MyDepot
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Gestion de dépôt de boissons
            </Text>
            <Text variant="bodySmall" style={styles.country}>
              🇨🇬 Congo Brazzaville
            </Text>
          </View>

          {/* Test Accounts Section */}
          <View style={styles.testAccountsSection}>
            <Button
              mode="outlined"
              icon="test-tube"
              onPress={() => setShowTestDialog(true)}
              style={styles.testButton}
            >
              Connexion test
            </Button>
          </View>

          <View style={styles.form}>
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

            <Link href="/forgot-password" asChild>
              <Button mode="text" style={styles.forgotButton}>
                Mot de passe oublié ?
              </Button>
            </Link>

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

            <Link href="/otp-verification" asChild>
              <Button mode="outlined" icon="phone" style={styles.otpButton}>
                Se connecter par SMS
              </Button>
            </Link>

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
  testButton: {
    borderStyle: 'dashed',
  },
  form: {
    width: '100%',
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
    backgroundColor: '#E0E0E0',
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
  },
});
