import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { getDatabase } from '@/lib/database/client';

export function useInAppReview() {
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    async function check() {
      const available = await StoreReview.isAvailableAsync();
      setCanReview(available);
    }
    check();
  }, []);

  const requestReview = async () => {
    if (!canReview) return;
    
    const db = await getDatabase();
    const settings = await db.getFirstAsync<{ last_review_prompt: number; check_in_count: number }>(
      'SELECT last_review_prompt, check_in_count FROM user_settings ORDER BY id DESC LIMIT 1'
    );

    const now = Date.now();
    const lastPrompt = settings?.last_review_prompt || 0;
    const checkInCount = settings?.check_in_count || 0;

    // Only prompt after 3 check-ins and not more than once every 30 days
    if (checkInCount >= 7 && now - lastPrompt > 30 * 24 * 60 * 60 * 1000) {
      await db.runAsync('UPDATE user_settings SET last_review_prompt = ?', [now]);
      await StoreReview.requestReview();
    }
  };

  return { requestReview };
}

export async function incrementCheckInCount(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE user_settings SET check_in_count = COALESCE(check_in_count, 0) + 1'
  );
}
