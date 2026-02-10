import { Stack } from 'expo-router';

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="expenses/index" />
      <Stack.Screen name="expenses/create" />
      <Stack.Screen name="expenses/edit/[id]" />
      <Stack.Screen name="salaries/index" />
      <Stack.Screen name="salaries/create" />
      <Stack.Screen name="salaries/edit/[id]" />
    </Stack>
  );
}
