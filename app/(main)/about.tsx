import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';
import { settingsService, DEFAULT_APP_SETTINGS } from '@/services/settings.service';

export default function AboutScreen() {
  const theme = useTheme();
  const [appName, setAppName] = useState(DEFAULT_APP_SETTINGS.appName);
  const [aboutText, setAboutText] = useState(DEFAULT_APP_SETTINGS.aboutText);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await settingsService.getAll();
        setAppName(settings.appName);
        setAboutText(settings.aboutText);
      } catch {
        setAppName(DEFAULT_APP_SETTINGS.appName);
        setAboutText(DEFAULT_APP_SETTINGS.aboutText);
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          À propos
        </Text>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.appName}>
              {appName}
            </Text>
            <Text variant="bodyMedium">{aboutText}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.md,
  },
  appName: {
    marginBottom: Spacing.sm,
    fontWeight: 'bold',
  },
});
