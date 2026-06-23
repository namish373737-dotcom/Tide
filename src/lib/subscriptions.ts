import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getDatabase } from '@/lib/database/client';
import * as Notifications from 'expo-notifications';

let revenueCatConfigured = false;

export function useRevenueCat() {
  const [offerings, setOfferings] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const RevenueCat = await import('react-native-purchases');
        const Purchases = RevenueCat.default;
        
        if (!revenueCatConfigured) {
          Purchases.configure({ apiKey: 'appl_YOUR_REVENUECAT_API_KEY' });
          revenueCatConfigured = true;
        }

        const offerings = await Purchases.getOfferings();
        const customerInfo = await Purchases.getCustomerInfo();
        
        setOfferings(offerings);
        setCustomerInfo(customerInfo);
      } catch (e) {
        console.log('RevenueCat not available in development:', e);
      }
      setLoading(false);
    }
    init();
  }, []);

  const purchase = async (packageIdentifier: string) => {
    try {
      const RevenueCat = await import('react-native-purchases');
      const Purchases = RevenueCat.default;
      const { customerInfo } = await Purchases.purchasePackage(
        offerings.current.availablePackages.find((p: any) => p.identifier === packageIdentifier)
      );
      setCustomerInfo(customerInfo);
      return { success: true, customerInfo };
    } catch (e: any) {
      if (e.userCancelled) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: e.message };
    }
  };

  const restore = async () => {
    try {
      const RevenueCat = await import('react-native-purchases');
      const Purchases = RevenueCat.default;
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      return { success: true, customerInfo };
    } catch (e: any) {
      return { success: false, error: e.message };
    };
  };

  const isPro = customerInfo?.entitlements?.active?.pro === true;

  return { offerings, customerInfo, loading, purchase, restore, isPro };
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }
  return true;
}

export async function scheduleDailyReminder(time: string = '21:00'): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const [hours, minutes] = time.split(':').map(Number);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time for your daily check-in',
      body: 'Track your symptoms in under 60 seconds.',
      sound: 'default',
    },
    trigger: { type: 'daily', hour: hours, minute: minutes } as any,
  });
  return id;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
