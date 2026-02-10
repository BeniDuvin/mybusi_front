import { Stack } from 'expo-router';

export default function PurchasesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="suppliers/index" />
      <Stack.Screen name="suppliers/create" />
      <Stack.Screen name="suppliers/edit/[id]" />
    </Stack>
  );
}
