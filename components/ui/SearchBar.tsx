import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar, useTheme } from 'react-native-paper';
import { BorderRadius, Spacing } from '@/constants/theme';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  value?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher...',
  onSearch,
  value: controlledValue,
}) => {
  const [query, setQuery] = useState(controlledValue || '');
  const theme = useTheme();

  const handleChangeText = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={handleChangeText}
      value={query}
      style={[
        styles.searchBar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      inputStyle={styles.input}
    />
  );
};

const styles = StyleSheet.create({
  searchBar: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  input: {
    fontSize: 14,
  },
});
