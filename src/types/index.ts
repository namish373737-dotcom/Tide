export interface Symptom { id: string; name: string; category: 'physical' | 'emotional' | 'cognitive'; }
export interface Trigger { id: string; name: string; category: 'diet' | 'sleep' | 'stress' | 'exercise' | 'environment' | 'medication'; }
export interface DailyLog { id: string; date: string; symptoms: LogSymptom[]; triggers: string[]; medications: LogMedication[]; cycleDay?: number; notes?: string; createdAt: string; updatedAt: string; }
export interface LogSymptom { symptomId: string; severity: number; }
export interface LogMedication { medicationId: string; name: string; dosage?: string; taken: boolean; time?: string; }
export interface Medication { id: string; name: string; dosage?: string; frequency: string; schedule?: string[]; startDate: string; endDate?: string; active: boolean; }
export interface Condition { id: string; name: string; symptomPack: string[]; triggerPack: string[]; active: boolean; }
export interface Insight { id: string; type: 'correlation' | 'pattern' | 'trend'; title: string; description: string; confidence: number; dataPoints: number; createdAt: string; }
export interface UserSettings { conditions: string[]; reminders: any[]; dataRetentionDays: number; exportFormat: 'pdf' | 'json' | 'csv'; }

export const SYMPTOM_PACKS: Record<string, Symptom[]> = {
  endometriosis: [
    { id: 'endo_pain', name: 'Pelvic Pain', category: 'physical' },
    { id: 'endo_cramps', name: 'Menstrual Cramps', category: 'physical' },
    { id: 'endo_bloating', name: 'Bloating', category: 'physical' },
    { id: 'endo_fatigue', name: 'Fatigue', category: 'physical' },
    { id: 'endo_nausea', name: 'Nausea', category: 'physical' },
    { id: 'endo_backpain', name: 'Lower Back Pain', category: 'physical' },
    { id: 'endo_mood', name: 'Mood Changes', category: 'emotional' },
    { id: 'endo_brainfog', name: 'Brain Fog', category: 'cognitive' },
  ],
  pcos: [
    { id: 'pcos_irregular', name: 'Irregular Period', category: 'physical' },
    { id: 'pcos_acne', name: 'Acne', category: 'physical' },
    { id: 'pcos_hairgrowth', name: 'Excess Hair Growth', category: 'physical' },
    { id: 'pcos_weight', name: 'Weight Changes', category: 'physical' },
    { id: 'pcos_fatigue', name: 'Fatigue', category: 'physical' },
    { id: 'pcos_mood', name: 'Mood Swings', category: 'emotional' },
    { id: 'pcos_cravings', name: 'Food Cravings', category: 'physical' },
    { id: 'pcos_brainfog', name: 'Brain Fog', category: 'cognitive' },
  ],
  fibromyalgia: [
    { id: 'fibro_widespread', name: 'Widespread Pain', category: 'physical' },
    { id: 'fibro_tenderness', name: 'Tender Points', category: 'physical' },
    { id: 'fibro_fatigue', name: 'Fatigue', category: 'physical' },
    { id: 'fibro_sleep', name: 'Sleep Issues', category: 'physical' },
    { id: 'fibro_stiffness', name: 'Morning Stiffness', category: 'physical' },
    { id: 'fibro_headache', name: 'Headaches', category: 'physical' },
    { id: 'fibro_brainfog', name: 'Fibro Fog', category: 'cognitive' },
    { id: 'fibro_mood', name: 'Mood Changes', category: 'emotional' },
  ],
  autoimmune: [
    { id: 'auto_fatigue', name: 'Fatigue', category: 'physical' },
    { id: 'auto_jointpain', name: 'Joint Pain', category: 'physical' },
    { id: 'auto_swelling', name: 'Swelling', category: 'physical' },
    { id: 'auto_fever', name: 'Low-grade Fever', category: 'physical' },
    { id: 'auto_skin', name: 'Skin Issues', category: 'physical' },
    { id: 'auto_digestive', name: 'Digestive Issues', category: 'physical' },
    { id: 'auto_brainfog', name: 'Brain Fog', category: 'cognitive' },
    { id: 'auto_mood', name: 'Mood Changes', category: 'emotional' },
  ],
};

export const COMMON_TRIGGERS: Trigger[] = [
  { id: 'dairy', name: 'Dairy', category: 'diet' },
  { id: 'gluten', name: 'Gluten', category: 'diet' },
  { id: 'sugar', name: 'High Sugar', category: 'diet' },
  { id: 'caffeine', name: 'Caffeine', category: 'diet' },
  { id: 'alcohol', name: 'Alcohol', category: 'diet' },
  { id: 'processed', name: 'Processed Foods', category: 'diet' },
  { id: 'poor_sleep', name: 'Poor Sleep', category: 'sleep' },
  { id: 'less_sleep', name: '< 7 hours sleep', category: 'sleep' },
  { id: 'high_stress', name: 'High Stress', category: 'stress' },
  { id: 'work_stress', name: 'Work Stress', category: 'stress' },
  { id: 'emotional_stress', name: 'Emotional Stress', category: 'stress' },
  { id: 'intense_exercise', name: 'Intense Exercise', category: 'exercise' },
  { id: 'no_exercise', name: 'No Exercise', category: 'exercise' },
  { id: 'weather_change', name: 'Weather Change', category: 'environment' },
  { id: 'cold', name: 'Cold Exposure', category: 'environment' },
  { id: 'heat', name: 'Heat Exposure', category: 'environment' },
];
