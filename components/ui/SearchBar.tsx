import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Spacing } from '@/constants/theme';

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

  const handleChangeText = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={handleChangeText}
      value={query}
      style={styles.searchBar}
    />
  );
};

const styles = StyleSheet.create({
  searchBar: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
});
