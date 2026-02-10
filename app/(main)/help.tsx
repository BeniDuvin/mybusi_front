import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';
import { settingsService, DEFAULT_APP_SETTINGS } from '@/services/settings.service';

export default function HelpScreen() {
  const theme = useTheme();
  const [helpText, setHelpText] = useState(DEFAULT_APP_SETTINGS.helpText);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await settingsService.getAll();
        setHelpText(settings.helpText);
      } catch {
        setHelpText(DEFAULT_APP_SETTINGS.helpText);
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          Aide
        </Text>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium">{helpText}</Text>
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
});
