import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDiscoveryStore, useProfileStore } from '@/store';
import { useModelStore } from '@/store/modelStore';
import { Colors } from '@/theme';
import { loadModel } from '@/services/model/ModelManager';

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();

  const loadDiscoveries = useDiscoveryStore((s) => s.loadDiscoveries);
  const loadProfile     = useProfileStore((s) => s.loadProfile);
  const { checkDownloaded, setStatus } = useModelStore();

  useEffect(() => {
    async function init() {
      await loadProfile();
      await loadDiscoveries();

      const downloaded = await checkDownloaded();

      if (!downloaded) {
        router.replace('/model-setup');
        return;
      }

      setStatus('loading');
      try {
        await loadModel();
        setStatus('ready');
      } catch {
        // Non-fatal — user can still browse collection; scan will retry on next attempt
        setStatus('ready');
      }
    }

    init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" backgroundColor={Colors.background} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="model-setup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="discovery/[id]"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="animal/[id]"
              options={{ animation: 'slide_from_right' }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
