import { useEffect, useState } from 'react';
import { getDatabase } from '@/lib/database/client';

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

  const syncProStatus = async (info: any) => {
    const db = await getDatabase();
    const active = info?.entitlements?.active?.pro === true;
    const expiry = info?.entitlements?.active?.pro?.expirationDate
      ? new Date(info.entitlements.active.pro.expirationDate).getTime()
      : null;
    await db.runAsync(
      'UPDATE user_settings SET pro_subscription_status = ?, pro_subscription_expiry = ?',
      [active ? 'active' : 'inactive', expiry]
    );
  };

  const purchase = async (packageIdentifier: string) => {
    try {
      const RevenueCat = await import('react-native-purchases');
      const Purchases = RevenueCat.default;
      const { customerInfo } = await Purchases.purchasePackage(
        offerings.current.availablePackages.find((p: any) => p.identifier === packageIdentifier)
      );
      setCustomerInfo(customerInfo);
      await syncProStatus(customerInfo);
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
      await syncProStatus(customerInfo);
      return { success: true, customerInfo };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const isPro = customerInfo?.entitlements?.active?.pro === true;

  return { offerings, customerInfo, loading, purchase, restore, isPro };
}
