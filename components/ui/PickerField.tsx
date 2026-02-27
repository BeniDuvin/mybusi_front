import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { PickerStyles } from '@/constants/theme';

type PickerFieldProps = {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  /** Variante filtres (barre horizontale) */
  variant?: 'form' | 'filter';
  /** Style optionnel pour le container */
  containerStyle?: ViewStyle;
};

export function PickerField({
  label,
  selectedValue,
  onValueChange,
  children,
  variant = 'form',
  containerStyle,
}: PickerFieldProps) {
  const theme = useTheme();
  const isFilter = variant === 'filter';
  const filterStyles = PickerStyles.filter;

  return (
    <View
      style={[
        PickerStyles.container as ViewStyle,
        isFilter && filterStyles.container as ViewStyle,
        containerStyle,
      ]}
    >
      <Text variant="bodyMedium" style={[PickerStyles.label, isFilter && styles.filterLabel]}>
        {label}
      </Text>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        dropdownIconColor={theme.colors.onSurface}
        style={[
          PickerStyles.picker as ViewStyle,
          isFilter && filterStyles.picker as ViewStyle,
          { color: theme.colors.onSurface },
        ]}
        itemStyle={PickerStyles.pickerItem as any}
      >
        {children}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  filterLabel: {
    paddingTop: 4,
    fontSize: 12,
  },
});
