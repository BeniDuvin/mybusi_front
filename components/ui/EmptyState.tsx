import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'tray',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <SymbolView
          name={icon as any}
          size={64}
          tintColor={theme.colors.onSurfaceDisabled}
          type="hierarchical"
          style={styles.icon}
        />

        <Text variant="titleLarge" style={styles.title}>
          {title}
        </Text>

        {message && (
          <Text variant="bodyMedium" style={styles.message}>
            {message}
          </Text>
        )}

        {actionLabel && onAction && (
          <Button mode="contained" onPress={onAction} style={styles.button}>
            {actionLabel}
          </Button>
        )}
      </View>
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
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: Spacing.xl,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  icon: {
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.md,
  },
});
