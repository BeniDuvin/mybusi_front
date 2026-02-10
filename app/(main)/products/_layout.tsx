import { Stack } from 'expo-router';

export default function ProductsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="categories/create" />
      <Stack.Screen name="categories/edit/[id]" />
      <Stack.Screen name="brands/index" />
      <Stack.Screen name="brands/create" />
      <Stack.Screen name="brands/edit/[id]" />
    </Stack>
  );
}
