import type { MD3Theme } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Colors
export const AppColors = {
  primary: '#FF385C',
  primaryDark: '#D90B3E',
  secondary: '#FFB400',
  secondaryDark: '#D99A00',
  accent: '#FFB400',
  error: '#C13515',
  warning: '#FFA800',
  info: '#1D4ED8',
  success: '#008A05',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7',
  text: '#222222',
  textSecondary: '#717171',
  textTertiary: '#B0B0B0',
  border: '#DDDDDD',
  borderLight: '#EBEBEB',
  disabled: '#B0B0B0',
};

// Light Theme
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: AppColors.primary,
    secondary: AppColors.secondary,
    tertiary: AppColors.accent,
    error: AppColors.error,
    background: AppColors.background,
    surface: AppColors.surface,
    surfaceVariant: AppColors.surfaceAlt,
    outline: AppColors.border,
    outlineVariant: AppColors.borderLight,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: AppColors.text,
    onSurface: AppColors.text,
    onSurfaceVariant: AppColors.textSecondary,
  },
};

// Dark Theme
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF6B86',
    secondary: '#FFD166',
    tertiary: '#FFB400',
    error: '#E56B4C',
    background: '#0B0B0B',
    surface: '#141414',
    surfaceVariant: '#1F1F1F',
    outline: '#2B2B2B',
    outlineVariant: '#2F2F2F',
    onBackground: '#F7F7F7',
    onSurface: '#F7F7F7',
    onSurfaceVariant: '#C9C9C9',
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Border Radius
export const BorderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 20,
  round: 999,
};

// Shadows
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};
