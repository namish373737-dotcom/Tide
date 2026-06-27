import { Platform } from 'react-native';

// TODO: No HealthKit library is currently compatible with Expo SDK 56 in this project
// (react-native-health requires a custom dev client and native config; expo-health does not
// exist for SDK 56). Once a compatible package is added, wire up real read permissions for
// HKQuantityTypeIdentifierStepCount and HKQuantityTypeIdentifierRestingHeartRate here.

export interface HealthData {
  steps: number | null;
  restingHeartRate: number | null;
}

export function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios';
}

export async function requestHealthPermissions(): Promise<boolean> {
  // TODO: implement real permission request when a HealthKit lib is available.
  return false;
}

export async function fetchTodayHealthData(): Promise<HealthData> {
  // TODO: implement real HealthKit reads. Returns nulls so the check-in screen
  // simply skips pre-fill without breaking.
  return { steps: null, restingHeartRate: null };
}
