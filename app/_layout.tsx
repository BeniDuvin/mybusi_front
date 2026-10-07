import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { lightTheme } from '@/constants/theme';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { PaperProvider } from 'react-native-paper';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Expo/Android may emit this internal warning even when app code
// does not use keep-awake; ignore to avoid noisy redbox in dev.
LogBox.ignoreLogs(['Unable to activate keep awake']);

function RootLayoutNav() {
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isSplash = pathname === '/' || pathname === '/index';

    if (isSplash) return;

    if (user?.mustChangePassword) {
      if (pathname !== '/force-change-password') {
        router.replace('/(main)/force-change-password');
      }
      return;
    }

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(main)/dashboard');
    }
  }, [user, loading, segments, pathname]);

  if (loading) {
    return <LoadingOverlay visible={true} message="Chargement..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={lightTheme}>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
