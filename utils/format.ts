import { format, formatDistance, formatRelative } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Format currency in XOF (CFA Franc)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

/**
 * Format date
 */
export const formatDate = (date: string | Date, pattern: string = 'dd/MM/yyyy'): string => {
  return format(new Date(date), pattern, { locale: fr });
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
};

/**
 * Format relative date (e.g., "il y a 2 heures")
 */
export const formatRelativeDate = (date: string | Date): string => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: fr });
};

/**
 * Format relative with date
 */
export const formatRelativeWithDate = (date: string | Date): string => {
  return formatRelative(new Date(date), new Date(), { locale: fr });
};

/**
 * Format phone number (Congo Brazzaville)
 */
export const formatPhone = (phone: string): string => {
  // Format as +242 XX XXX XX XX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('242')) {
    return `+242 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  } else if (cleaned.length === 9) {
    // Format local number
    return `+242 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Truncate text
 */
export const truncate = (text: string, length: number = 50): string => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
