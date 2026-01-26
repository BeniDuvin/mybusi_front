import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';
import { Spacing } from '@/constants/theme';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
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
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <SymbolView
            name={icon as any}
            size={24}
            tintColor={iconColor || theme.colors.primary}
            type="hierarchical"
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
            <SymbolView
              name={trend === 'up' ? 'arrow.up' : 'arrow.down'}
              size={14}
              tintColor={trendColor}
              type="hierarchical"
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
  },
  content: {
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    marginLeft: Spacing.sm,
    opacity: 0.7,
  },
  value: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.6,
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
