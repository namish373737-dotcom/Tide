import { useEffect, useState } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDatabase } from '@/lib/database/client';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/theme';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2,
});

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
      } catch (e) {
        console.error('Database init failed:', e);
      }
      setDbReady(true);
      SplashScreen.hideAsync();
    }
    init();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="check-in" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="report" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
