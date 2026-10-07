import { useStoreAccess } from '@/hooks/useStoreAccess';
import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';

/** Makes the tenant receiving a create/edit action clear without allowing cross-store writes. */
export function StoreContextText({ style }: { style?: StyleProp<TextStyle> }) {
  const { store } = useStoreAccess();
  return <Text style={style}>Boutique active : {store?.name || 'chargement…'}</Text>;
}
