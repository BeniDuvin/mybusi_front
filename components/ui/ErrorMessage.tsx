import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';
import { Spacing } from '@/constants/theme';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Une erreur est survenue',
  message,
  onRetry,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <SymbolView
        name="exclamationmark.triangle"
        size={48}
        tintColor={theme.colors.error}
        type="hierarchical"
        style={styles.icon}
      />
      
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.error }]}>
        {title}
      </Text>
      
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
      
      {onRetry && (
        <Button mode="contained" onPress={onRetry} style={styles.button}>
          Réessayer
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.md,
  },
});
