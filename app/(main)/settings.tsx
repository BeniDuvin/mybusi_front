import { Spacing } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { DEFAULT_APP_SETTINGS, settingsService } from '@/services/settings.service';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { hasRole } = useAuthContext();
  const isAdmin = hasRole(['ADMIN']);

  const [appName, setAppName] = useState(DEFAULT_APP_SETTINGS.appName);
  const [helpText, setHelpText] = useState(DEFAULT_APP_SETTINGS.helpText);
  const [aboutText, setAboutText] = useState(DEFAULT_APP_SETTINGS.aboutText);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await settingsService.getAll();
        setAppName(settings.appName);
        setHelpText(settings.helpText);
        setAboutText(settings.aboutText);
      } catch {
        setError('Impossible de charger les paramètres');
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!appName.trim()) {
      setError('Le nom de l’application est obligatoire');
      return;
    }

    try {
      await settingsService.saveAll({ appName, helpText, aboutText });
      setSuccess('Paramètres enregistrés');
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(main)/dashboard');
        }
      }, 1200);
    } catch {
      setError('Erreur lors de l’enregistrement');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Paramètres
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Nom de l’application *"
                value={appName}
                onChangeText={setAppName}
                mode="outlined"
                style={styles.input}
                disabled={!isAdmin}
              />

              <TextInput
                label="Aide"
                value={helpText}
                onChangeText={setHelpText}
                mode="outlined"
                multiline
                numberOfLines={5}
                style={styles.input}
                disabled={!isAdmin}
              />

              <TextInput
                label="À propos"
                value={aboutText}
                onChangeText={setAboutText}
                mode="outlined"
                multiline
                numberOfLines={5}
                style={styles.input}
                disabled={!isAdmin}
              />
            </Card.Content>
          </Card>

          {isAdmin && (
            <Button mode="contained" onPress={handleSave} style={styles.submitButton}>
              Enregistrer
            </Button>
          )}

          {!isAdmin && (
            <Text variant="bodySmall" style={styles.readOnlyNote}>
              Seuls les administrateurs peuvent modifier ces paramètres.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
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
    padding: Spacing.md,
    paddingBottom: 100,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  readOnlyNote: {
    opacity: 0.7,
    marginTop: Spacing.md,
  },
});
