import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import type { PaymentStatus, PurchaseStatus, SaleStatus } from '@/types';

interface StatusBadgeProps {
  status: SaleStatus | PaymentStatus | PurchaseStatus | string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: 'Complété',
          color: theme.colors.primary,
          textColor: '#fff',
        };
      case 'PENDING':
        return {
          label: 'En attente',
          color: theme.colors.tertiary,
          textColor: '#fff',
        };
      case 'CANCELLED':
      case 'FAILED':
        return {
          label: status === 'CANCELLED' ? 'Annulé' : 'Échoué',
          color: theme.colors.error,
          textColor: '#fff',
        };
      case 'RECEIVED':
        return {
          label: 'Reçu',
          color: theme.colors.primary,
          textColor: '#fff',
        };
      default:
        return {
          label: status,
          color: theme.colors.surfaceVariant,
          textColor: theme.colors.onSurfaceVariant,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      mode="flat"
      style={[
        styles.badge,
        {
          backgroundColor: config.color,
          borderColor: theme.colors.outline,
        },
      ]}
      textStyle={[styles.text, { color: config.textColor }]}
      compact={size === 'small'}
    >
      {config.label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
