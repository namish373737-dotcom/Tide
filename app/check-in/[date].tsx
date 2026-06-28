import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, StatusBar, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSymptoms, useTriggers } from '@/hooks/useEntities';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import { getDatabase } from '@/lib/database/client';
import { format } from 'date-fns';
import { ChevronLeft, Save } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

import { hapticSuccess, hapticSelection } from '@/lib/haptics';
import { useInAppReview, incrementCheckInCount } from '@/lib/reviews';
import { fetchTodayHealthData, isHealthKitAvailable } from '@/lib/healthkit';

export default function CheckInScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateInt = parseInt(date || '0');
  const { entry, symptomLogs, triggerLogs, loading, saveEntry, saveSymptomLog, saveTriggerLog } = useDailyEntry(dateInt);
  const { symptoms } = useSymptoms();
  const { triggers } = useTriggers();
  const { requestReview } = useInAppReview();

  const [notes, setNotes] = useState(entry?.notes || '');
  const [mood, setMood] = useState(entry?.mood || 3);
  const [energy, setEnergy] = useState(entry?.energy || 3);
  const [sleepHours, setSleepHours] = useState<number | null>(entry?.sleepHours || null);
  const [symptomValues, setSymptomValues] = useState<Record<number, number>>({});
  const [triggerValues, setTriggerValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState<number | null>(null);
  const [restingHeartRate, setRestingHeartRate] = useState<number | null>(null);

  useEffect(() => {
    if (!isHealthKitAvailable()) return;
    const today = new Date();
    const todayInt = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    if (dateInt !== todayInt) return;
    fetchTodayHealthData().then(data => {
      if (data.steps !== null) setSteps(data.steps);
      if (data.restingHeartRate !== null) setRestingHeartRate(data.restingHeartRate);
    }).catch(() => {});
  }, [dateInt]);

  useEffect(() => {
    if (entry?.steps != null) setSteps(entry.steps);
    if (entry?.restingHeartRate != null) setRestingHeartRate(entry.restingHeartRate);
  }, [entry]);

  useEffect(() => {
    if (!loading) {
      const sMap: Record<number, number> = {};
      symptomLogs.forEach(l => { sMap[l.symptomId] = l.severity; });
      setSymptomValues(sMap);
      const tMap: Record<number, string> = {};
      triggerLogs.forEach(l => { tMap[l.triggerId] = l.value; });
      setTriggerValues(tMap);
      if (entry) { setNotes(entry.notes || ''); setMood(entry.mood || 3); setEnergy(entry.energy || 3); setSleepHours(entry.sleepHours || null); }
    }
  }, [loading, symptomLogs, triggerLogs, entry]);

  const handleSymptomChange = (id: number, value: number) => { hapticSelection(); setSymptomValues(prev => ({ ...prev, [id]: value })); };
  const handleTriggerToggle = (id: number) => { hapticSelection(); setTriggerValues(prev => ({ ...prev, [id]: prev[id] === 'true' ? 'false' : 'true' })); };
  const handleTriggerScale = (id: number, value: number) => { hapticSelection(); setTriggerValues(prev => ({ ...prev, [id]: value.toString() })); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveEntry({ notes, mood, energy, sleepHours: sleepHours ?? undefined, steps: steps ?? undefined, restingHeartRate: restingHeartRate ?? undefined });
      for (const [sid, sev] of Object.entries(symptomValues)) { await saveSymptomLog(parseInt(sid), sev); }
      for (const [tid, val] of Object.entries(triggerValues)) { await saveTriggerLog(parseInt(tid), val); }
      hapticSuccess();
      await incrementCheckInCount();
      await requestReview();
      router.back();
    } catch (e) {
      console.error('Save failed:', e);
      Alert.alert('Save Failed', 'Something went wrong saving your check-in. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const dateObj = new Date(Math.floor(dateInt / 10000), Math.floor((dateInt % 10000) / 100) - 1, dateInt % 100);
  const isToday = isSameDay(dateObj, new Date());
  const quickValues = [0, 3, 5, 7, 10];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{isToday ? "Today's Check-in" : format(dateObj, 'EEEE, MMM d')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mood & Energy */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How are you feeling?</Text>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Mood</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <Pressable key={v} onPress={() => { hapticSelection(); setMood(v); }} style={[styles.ratingButton, mood === v && styles.ratingButtonActive]}>
                  <Text style={[styles.ratingButtonText, mood === v && styles.ratingButtonTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Energy</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <Pressable key={v} onPress={() => { hapticSelection(); setEnergy(v); }} style={[styles.ratingButton, energy === v && styles.ratingButtonActive]}>
                  <Text style={[styles.ratingButtonText, energy === v && styles.ratingButtonTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Sleep (hours)</Text>
            <View style={styles.ratingRow}>
              {[4, 5, 6, 7, 8, 9].map(v => (
                <Pressable key={v} onPress={() => { hapticSelection(); setSleepHours(v); }} style={[styles.ratingButton, sleepHours === v && styles.ratingButtonActive]}>
                  <Text style={[styles.ratingButtonText, sleepHours === v && styles.ratingButtonTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Symptoms */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Symptoms</Text>
          {symptoms.map(symptom => (
            <View key={symptom.id} style={styles.symptomRow}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomName}>{symptom.displayName}</Text>
                <Text style={styles.symptomValue}>{symptomValues[symptom.id] ?? '-'}/10</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((symptomValues[symptom.id] || 0) / 10) * 100}%` }]} />
              </View>
              <View style={styles.quickValues}>
                {quickValues.map(v => (
                  <Pressable key={v} onPress={() => handleSymptomChange(symptom.id, v)} style={[styles.quickButton, symptomValues[symptom.id] === v && styles.quickButtonActive]}>
                    <Text style={[styles.quickButtonText, symptomValues[symptom.id] === v && styles.quickButtonTextActive]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Triggers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Triggers</Text>
          {triggers.map(trigger => {
            if (trigger.inputType === 'scale') {
              const current = parseInt(triggerValues[trigger.id] || '0', 10) || 0;
              return (
                <View key={trigger.id} style={styles.scaleTriggerRow}>
                  <Text style={styles.scaleTriggerLabel}>{trigger.displayName}</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <Pressable key={v} onPress={() => handleTriggerScale(trigger.id, v)} style={[styles.ratingButton, current === v && styles.ratingButtonActive]}>
                        <Text style={[styles.ratingButtonText, current === v && styles.ratingButtonTextActive]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            }
            return (
              <Pressable key={trigger.id} onPress={() => handleTriggerToggle(trigger.id)} style={[styles.triggerRow, triggerValues[trigger.id] === 'true' && styles.triggerRowActive]}>
                <Text style={[styles.triggerName, triggerValues[trigger.id] === 'true' && styles.triggerNameActive]}>{trigger.displayName}</Text>
                <View style={[styles.triggerCheck, triggerValues[trigger.id] === 'true' && styles.triggerCheckActive]}>
                  {triggerValues[trigger.id] === 'true' && <Text style={styles.triggerCheckMark}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Medications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medications</Text>
          <MedicationSection entryId={entry?.id} dateInt={dateInt} />
        </View>

        {/* Cycle Tracking */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cycle</Text>
          <CycleSection entryId={entry?.id} dateInt={dateInt} />
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Anything else to note today?" placeholderTextColor={COLORS.textTertiary} multiline numberOfLines={3} style={styles.notesInput} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={handleSave} disabled={saving} style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}>
          <Save size={20} color={COLORS.white} />
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Check-in'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function isSameDay(d1: Date, d2: Date): boolean { return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(); }

function MedicationSection({ entryId, dateInt }: { entryId?: number; dateInt: number }) {
  const [medications, setMedications] = useState<any[]>([]);
  const [medLogs, setMedLogs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const meds = await db.getAllAsync('SELECT * FROM medications WHERE is_active = 1');
      setMedications(meds);
      if (entryId) {
        const logs = await db.getAllAsync<any>('SELECT * FROM medication_logs WHERE daily_entry_id = ?', [entryId]);
        const map: Record<number, boolean> = {};
        logs.forEach((l: any) => { map[l.medication_id] = l.taken; });
        setMedLogs(map);
      }
    }
    fetch();
  }, [entryId]);

  const toggleMed = async (medId: number) => {
    const db = await getDatabase();
    const newValue = !medLogs[medId];
    let eid = entryId;
    if (!eid) {
      const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM daily_entries WHERE entry_date = ?', [dateInt]);
      if (existing) {
        eid = existing.id;
      } else {
        const result = await db.runAsync('INSERT INTO daily_entries (entry_date) VALUES (?)', [dateInt]);
        eid = result.lastInsertRowId;
      }
    }
    await db.runAsync('INSERT OR REPLACE INTO medication_logs (daily_entry_id, medication_id, taken) VALUES (?, ?, ?)', [eid, medId, newValue ? 1 : 0]);
    setMedLogs(prev => ({ ...prev, [medId]: newValue }));
  };

  if (medications.length === 0) {
    return <Text style={styles.emptyText}>No medications configured. Add them in Settings.</Text>;
  }

  return (
    <View style={{ gap: SPACING.sm }}>
      {medications.map((med: any) => (
        <Pressable key={med.id} onPress={() => toggleMed(med.id)} style={[styles.medRow, medLogs[med.id] && styles.medRowActive]}>
          <Text style={[styles.medName, medLogs[med.id] && styles.medNameActive]}>{med.name}</Text>
          <Text style={styles.medDose}>{med.dosage || ''}</Text>
          <View style={[styles.medCheck, medLogs[med.id] && styles.medCheckActive]}>
            {medLogs[med.id] && <Text style={styles.medCheckMark}>✓</Text>}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const FLOW_LEVELS: { value: 'none' | 'spotting' | 'light' | 'medium' | 'heavy'; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: COLORS.textTertiary },
  { value: 'spotting', label: 'Spotting', color: '#FED7D7' },
  { value: 'light', label: 'Light', color: '#FBD38D' },
  { value: 'medium', label: 'Medium', color: '#F6AD55' },
  { value: 'heavy', label: 'Heavy', color: '#E53E3E' },
];

const PHASES: { value: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'; label: string }[] = [
  { value: 'menstrual', label: 'Menstrual' },
  { value: 'follicular', label: 'Follicular' },
  { value: 'ovulatory', label: 'Ovulatory' },
  { value: 'luteal', label: 'Luteal' },
];

const OVULATION_OPTIONS: { value: 'positive' | 'negative' | 'none'; label: string }[] = [
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
  { value: 'none', label: 'Not tested' },
];

const MUCUS_OPTIONS = ['dry', 'sticky', 'creamy', 'watery', 'egg_white'];
const MUCUS_LABELS: Record<string, string> = {
  dry: 'Dry', sticky: 'Sticky', creamy: 'Creamy', watery: 'Watery', egg_white: 'Egg white',
};

function CycleSection({ entryId, dateInt }: { entryId?: number; dateInt: number }) {
  const [flowLevel, setFlowLevel] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [ovulationTest, setOvulationTest] = useState<'positive' | 'negative' | 'none'>('none');
  const [cervicalMucus, setCervicalMucus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetch() {
      if (!entryId) { setLoaded(true); return; }
      const db = await getDatabase();
      const log = await db.getFirstAsync<any>(
        'SELECT flow_level, phase, ovulation_test, cervical_mucus FROM cycle_logs WHERE daily_entry_id = ?',
        [entryId]
      );
      if (log) {
        setFlowLevel(log.flow_level ?? null);
        setPhase(log.phase ?? null);
        setOvulationTest(log.ovulation_test === 1 ? 'positive' : log.ovulation_test === 0 ? 'negative' : 'none');
        setCervicalMucus(log.cervical_mucus ?? null);
      }
      setLoaded(true);
    }
    fetch();
  }, [entryId]);

  const upsert = async (updates: { flow_level?: string | null; phase?: string | null; ovulation_test?: number | null; cervical_mucus?: string | null }) => {
    const db = await getDatabase();
    let eid = entryId;
    if (!eid) {
      const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM daily_entries WHERE entry_date = ?', [dateInt]);
      if (existing) eid = existing.id;
      else {
        const result = await db.runAsync('INSERT INTO daily_entries (entry_date) VALUES (?)', [dateInt]);
        eid = result.lastInsertRowId;
      }
    }
    const existing = await db.getFirstAsync<any>('SELECT flow_level, phase, ovulation_test, cervical_mucus FROM cycle_logs WHERE daily_entry_id = ?', [eid]);
    const merged = {
      flow_level: updates.flow_level !== undefined ? updates.flow_level : existing?.flow_level ?? null,
      phase: updates.phase !== undefined ? updates.phase : existing?.phase ?? null,
      ovulation_test: updates.ovulation_test !== undefined ? updates.ovulation_test : existing?.ovulation_test ?? null,
      cervical_mucus: updates.cervical_mucus !== undefined ? updates.cervical_mucus : existing?.cervical_mucus ?? null,
    };
    const allNull = merged.flow_level === null && merged.phase === null && merged.ovulation_test === null && merged.cervical_mucus === null;
    if (allNull) {
      await db.runAsync('DELETE FROM cycle_logs WHERE daily_entry_id = ?', [eid]);
    } else {
      await db.runAsync(
        'INSERT OR REPLACE INTO cycle_logs (daily_entry_id, flow_level, phase, ovulation_test, cervical_mucus) VALUES (?, ?, ?, ?, ?)',
        [eid, merged.flow_level, merged.phase, merged.ovulation_test, merged.cervical_mucus]
      );
    }
  };

  const selectFlow = async (value: string) => {
    hapticSelection();
    const newLevel = flowLevel === value ? null : value;
    setFlowLevel(newLevel);
    await upsert({ flow_level: newLevel });
  };
  const selectPhase = async (value: string) => {
    hapticSelection();
    const newPhase = phase === value ? null : value;
    setPhase(newPhase);
    await upsert({ phase: newPhase });
  };
  const selectOvulation = async (value: 'positive' | 'negative' | 'none') => {
    hapticSelection();
    setOvulationTest(value);
    await upsert({ ovulation_test: value === 'positive' ? 1 : value === 'negative' ? 0 : null });
  };
  const selectMucus = async (value: string) => {
    hapticSelection();
    const newMucus = cervicalMucus === value ? null : value;
    setCervicalMucus(newMucus);
    await upsert({ cervical_mucus: newMucus });
  };

  if (!loaded) {
    return <Text style={styles.emptyText}>Loading…</Text>;
  }

  return (
    <View>
      <Text style={styles.cycleLabel}>Flow Level</Text>
      <View style={styles.pillRow}>
        {FLOW_LEVELS.map(level => {
          const active = flowLevel === level.value;
          return (
            <Pressable key={level.value} onPress={() => selectFlow(level.value)} style={[styles.pill, active && { backgroundColor: level.color, borderColor: level.color }]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{level.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.cycleLabel, { marginTop: SPACING.lg }]}>Phase</Text>
      <View style={styles.pillRow}>
        {PHASES.map(p => {
          const active = phase === p.value;
          return (
            <Pressable key={p.value} onPress={() => selectPhase(p.value)} style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.cycleLabel, { marginTop: SPACING.lg }]}>Ovulation Test</Text>
      <View style={styles.pillRow}>
        {OVULATION_OPTIONS.map(o => {
          const active = ovulationTest === o.value;
          return (
            <Pressable key={o.value} onPress={() => selectOvulation(o.value)} style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.cycleLabel, { marginTop: SPACING.lg }]}>Cervical Mucus</Text>
      <View style={styles.pillRow}>
        {MUCUS_OPTIONS.map(m => {
          const active = cervicalMucus === m;
          return (
            <Pressable key={m} onPress={() => selectMucus(m)} style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{MUCUS_LABELS[m]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: SPACING.base },
  backButton: { padding: SPACING.sm, width: 44 },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1, textAlign: 'center' },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: 120 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  cardTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.lg },
  ratingSection: { marginBottom: SPACING.lg },
  ratingLabel: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ratingButton: { width: 56, height: 56, borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  ratingButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ratingButtonText: { ...TYPOGRAPHY.h4, color: COLORS.text },
  ratingButtonTextActive: { color: COLORS.white },
  symptomRow: { marginBottom: SPACING.lg },
  symptomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  symptomName: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '500' },
  symptomValue: { ...TYPOGRAPHY.h4, color: COLORS.primary },
  sliderTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, marginBottom: SPACING.sm, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  quickValues: { flexDirection: 'row', justifyContent: 'space-between' },
  quickButton: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceElevated },
  quickButtonActive: { backgroundColor: COLORS.primary },
  quickButtonText: { ...TYPOGRAPHY.label, color: COLORS.text },
  quickButtonTextActive: { color: COLORS.white },
  triggerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.sm, backgroundColor: COLORS.surfaceElevated },
  triggerRowActive: { backgroundColor: 'rgba(13, 115, 119, 0.08)', borderColor: COLORS.primary },
  triggerName: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '500' },
  triggerNameActive: { color: COLORS.primary },
  triggerCheck: { width: 24, height: 24, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  triggerCheckActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  triggerCheckMark: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  notesInput: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: SPACING.base, ...TYPOGRAPHY.body, color: COLORS.text, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: LAYOUT.screenPadding, paddingBottom: LAYOUT.safeBottom + SPACING.base, paddingTop: SPACING.base, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.divider },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: LAYOUT.buttonHeight, ...SHADOWS.md },
  saveButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  saveButtonText: { ...TYPOGRAPHY.button, color: COLORS.white, marginLeft: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.md },
  medRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.sm, backgroundColor: COLORS.surfaceElevated },
  medRowActive: { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: COLORS.success },
  medName: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '500' },
  medNameActive: { color: COLORS.success },
  medDose: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary },
  medCheck: { width: 24, height: 24, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  medCheckActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  medCheckMark: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  cycleLabel: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pill: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceElevated, borderWidth: 1.5, borderColor: COLORS.border },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { ...TYPOGRAPHY.label, color: COLORS.text },
  pillTextActive: { color: COLORS.white, fontWeight: '700' },
  scaleTriggerRow: { marginBottom: SPACING.lg },
  scaleTriggerLabel: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '500', marginBottom: SPACING.sm },
});
