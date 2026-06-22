import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/theme';

export default function OnboardingRedirect() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const db = await getDatabase();
        const settings = await db.getFirstAsync<{ onboarding_complete: number }>(
          'SELECT onboarding_complete FROM user_settings ORDER BY id DESC LIMIT 1'
        );
        setOnboardingComplete(!!settings?.onboarding_complete);
      } catch (e) {
        console.error('Failed to check onboarding status:', e);
        setOnboardingComplete(false);
      }
    }
    check();
  }, []);

  if (onboardingComplete === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
