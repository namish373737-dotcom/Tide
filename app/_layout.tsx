import { useEffect, useState } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDatabase } from '@/lib/database/client';
import { View, ActivityIndicator, StyleSheet, BackHandler, Platform, Alert } from 'react-native';
import { COLORS } from '@/lib/theme';
import * as Sentry from '@sentry/react-native';
import * as LocalAuthentication from 'expo-local-authentication';

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
        const db = await getDatabase();
        const settings = await db.getFirstAsync<{ biometric_lock_enabled: number }>(
          'SELECT biometric_lock_enabled FROM user_settings LIMIT 1'
        );
        if (settings?.biometric_lock_enabled) {
          let authenticated = false;
          while (!authenticated) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Unlock Solace',
              fallbackLabel: 'Use Passcode',
            });
            if (result.success) {
              authenticated = true;
            } else if (Platform.OS === 'android') {
              BackHandler.exitApp();
              return;
            } else {
              await new Promise<void>(resolve =>
                Alert.alert('Unlock Required', 'Please authenticate to access Solace.', [
                  { text: 'Try Again', onPress: () => resolve() },
                ])
              );
            }
          }
        }
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
        <Stack.Screen name="manage-symptoms" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="manage-triggers" options={{ animation: 'slide_from_right' }} />
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
