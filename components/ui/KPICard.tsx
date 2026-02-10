import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  iconColor,
  subtitle,
  trend,
  trendValue,
  onPress,
}) => {
  const theme = useTheme();

  const trendColor =
    trend === 'up' ? theme.colors.primary : trend === 'down' ? theme.colors.error : undefined;

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      onPress={onPress}
      mode="contained"
    >
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={iconColor || theme.colors.primary}
          />
          <Text variant="bodySmall" style={styles.title}>
            {title}
          </Text>
        </View>

        <Text variant="headlineMedium" style={styles.value}>
          {value}
        </Text>

        {subtitle && (
          <Text variant="bodySmall" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}

        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons
              name={trend === 'up' ? 'trending-up' : 'trending-down'}
              size={14}
              color={trendColor}
            />
            <Text variant="bodySmall" style={[styles.trend, { color: trendColor }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  content: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    marginLeft: Spacing.sm,
    opacity: 0.75,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.65,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  trend: {
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
});
