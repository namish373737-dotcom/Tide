export interface Condition {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
}

export interface Symptom {
  id: number;
  conditionId: number | null;
  name: string;
  displayName: string;
  description: string | null;
  category: string | null;
  isEnabled: boolean;
  isCustom: boolean;
  sortOrder: number;
  createdAt: number;
}

export interface Trigger {
  id: number;
  name: string;
  displayName: string;
  category: string | null;
  inputType: 'boolean' | 'scale' | 'count' | 'text';
  isEnabled: boolean;
  isCustom: boolean;
  sortOrder: number;
  createdAt: number;
}

export interface Medication {
  id: number;
  name: string;
  dosage: string | null;
  frequency: string | null;
  purpose: string | null;
  reminderTime: string | null;
  isActive: boolean;
  createdAt: number;
}

export interface DailyEntry {
  id: number;
  entryDate: number; // YYYYMMDD
  notes: string | null;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  steps: number | null;
  restingHeartRate: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SymptomLog {
  id: number;
  dailyEntryId: number;
  symptomId: number;
  severity: number; // 0-10
  notes: string | null;
}

export interface TriggerLog {
  id: number;
  dailyEntryId: number;
  triggerId: number;
  value: string;
  notes: string | null;
}

export interface MedicationLog {
  id: number;
  dailyEntryId: number;
  medicationId: number;
  taken: boolean;
  takenAt: number | null;
  doseTaken: string | null;
  notes: string | null;
}

export interface CycleLog {
  id: number;
  dailyEntryId: number;
  flowLevel: 'none' | 'spotting' | 'light' | 'medium' | 'heavy' | null;
  cycleDay: number | null;
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | null;
  ovulationTest: boolean | null;
  cervicalMucus: string | null;
}

export interface Insight {
  id: number;
  generatedAt: number;
  insightType: 'correlation' | 'trend' | 'cycle' | 'medication';
  title: string;
  description: string;
  severity: 'info' | 'positive' | 'warning' | 'action' | null;
  dataJson: string | null;
  isDismissed: boolean;
  validUntil: number | null;
}

export interface UserSettings {
  id: number;
  onboardingComplete: boolean;
  selectedConditions: string; // JSON array
  dailyReminderTime: string;
  reminderEnabled: boolean;
  healthkitSyncEnabled: boolean;
  healthkitSyncTypes: string | null; // JSON array
  icloudBackupEnabled: boolean;
  biometricLockEnabled: boolean;
  darkModePreference: 'system' | 'light' | 'dark';
  proSubscriptionStatus: 'inactive' | 'trial' | 'active' | 'expired';
  proSubscriptionExpiry: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface CorrelationResult {
  correlation: number;
  significance: boolean;
  sampleSize: number;
  symptomName: string;
  triggerName: string;
}

export interface PhaseAverage {
  phase: string;
  average: number;
}

export interface MedicationEfficacy {
  medicationName: string;
  onMedication: number;
  offMedication: number;
  difference: number;
  daysTracked: number;
}
