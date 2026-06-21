import { useEffect, useState } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDatabase } from '@/lib/database/client';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/theme';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function init() {
      await getDatabase();
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
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding/welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding/conditions" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding/symptoms" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding/triggers" options={{ animation: 'fade' }} />
        <Stack.Screen name="check-in/[date]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="report/index" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
