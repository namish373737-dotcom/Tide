import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';

export default function OnboardingRedirect() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const db = await getDatabase();
      const settings = await db.getFirstAsync<{ onboarding_complete: number }>(
        'SELECT onboarding_complete FROM user_settings LIMIT 1'
      );
      setOnboardingComplete(!!settings?.onboarding_complete);
    }
    check();
  }, []);

  if (onboardingComplete === null) return null;

  if (onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
