import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSymptoms, useTriggers } from '@/hooks/useEntities';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import { getDatabase } from '@/lib/database/client';
import { format } from 'date-fns';
import { ChevronLeft, Save } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function CheckInScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const dateInt = parseInt(date || '0');
  const { entry, symptomLogs, triggerLogs, loading, saveEntry, saveSymptomLog, saveTriggerLog } = useDailyEntry(dateInt);
  const { symptoms } = useSymptoms();
  const { triggers } = useTriggers();

  const [notes, setNotes] = useState(entry?.notes || '');
  const [mood, setMood] = useState(entry?.mood || 3);
  const [energy, setEnergy] = useState(entry?.energy || 3);
  const [symptomValues, setSymptomValues] = useState<Record<number, number>>({});
  const [triggerValues, setTriggerValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      const sMap: Record<number, number> = {};
      symptomLogs.forEach(l => { sMap[l.symptomId] = l.severity; });
      setSymptomValues(sMap);
      const tMap: Record<number, string> = {};
      triggerLogs.forEach(l => { tMap[l.triggerId] = l.value; });
      setTriggerValues(tMap);
      if (entry) { setNotes(entry.notes || ''); setMood(entry.mood || 3); setEnergy(entry.energy || 3); }
    }
  }, [loading, symptomLogs, triggerLogs, entry]);

  const handleSymptomChange = (id: number, value: number) => { setSymptomValues(prev => ({ ...prev, [id]: value })); };
  const handleTriggerToggle = (id: number) => { setTriggerValues(prev => ({ ...prev, [id]: prev[id] === 'true' ? 'false' : 'true' })); };

  const handleSave = async () => {
    setSaving(true);
    await saveEntry({ notes, mood, energy });
    for (const [sid, sev] of Object.entries(symptomValues)) { await saveSymptomLog(parseInt(sid), sev); }
    for (const [tid, val] of Object.entries(triggerValues)) { await saveTriggerLog(parseInt(tid), val); }
    setSaving(false);
    router.back();
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
                <Pressable key={v} onPress={() => setMood(v)} style={[styles.ratingButton, mood === v && styles.ratingButtonActive]}>
                  <Text style={[styles.ratingButtonText, mood === v && styles.ratingButtonTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Energy</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <Pressable key={v} onPress={() => setEnergy(v)} style={[styles.ratingButton, energy === v && styles.ratingButtonActive]}>
                  <Text style={[styles.ratingButtonText, energy === v && styles.ratingButtonTextActive]}>{v}</Text>
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
          {triggers.map(trigger => (
            <Pressable key={trigger.id} onPress={() => handleTriggerToggle(trigger.id)} style={[styles.triggerRow, triggerValues[trigger.id] === 'true' && styles.triggerRowActive]}>
              <Text style={[styles.triggerName, triggerValues[trigger.id] === 'true' && styles.triggerNameActive]}>{trigger.displayName}</Text>
              <View style={[styles.triggerCheck, triggerValues[trigger.id] === 'true' && styles.triggerCheckActive]}>
                {triggerValues[trigger.id] === 'true' && <Text style={styles.triggerCheckMark}>✓</Text>}
              </View>
            </Pressable>
          ))}
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
      const result = await db.runAsync('INSERT INTO daily_entries (entry_date) VALUES (?)', [dateInt]);
      eid = result.lastInsertRowId;
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

function CycleSection({ entryId, dateInt }: { entryId?: number; dateInt: number }) {
  const [flowLevel, setFlowLevel] = useState<string | null>(null);
  const levels = [
    { value: 'none', label: 'None', color: COLORS.textTertiary },
    { value: 'spotting', label: 'Spotting', color: '#FCD34D' },
    { value: 'light', label: 'Light', color: '#FBBF24' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'heavy', label: 'Heavy', color: '#EF4444' },
  ];

  useEffect(() => {
    async function fetch() {
      if (!entryId) return;
      const db = await getDatabase();
      const log = await db.getFirstAsync<any>('SELECT flow_level FROM cycle_logs WHERE daily_entry_id = ?', [entryId]);
      if (log) setFlowLevel(log.flow_level);
    }
    fetch();
  }, [entryId]);

  const selectFlow = async (value: string) => {
    const db = await getDatabase();
    const newLevel = flowLevel === value ? null : value;
    let eid = entryId;
    if (!eid) {
      const result = await db.runAsync('INSERT INTO daily_entries (entry_date) VALUES (?)', [dateInt]);
      eid = result.lastInsertRowId;
    }
    if (newLevel) {
      await db.runAsync('INSERT OR REPLACE INTO cycle_logs (daily_entry_id, flow_level) VALUES (?, ?)', [eid, newLevel]);
    } else {
      await db.runAsync('DELETE FROM cycle_logs WHERE daily_entry_id = ?', [eid]);
    }
    setFlowLevel(newLevel);
  };

  return (
    <View>
      <Text style={styles.cycleLabel}>Flow Level</Text>
      <View style={styles.cycleRow}>
        {levels.map(level => (
          <Pressable key={level.value} onPress={() => selectFlow(level.value)} style={[styles.cycleButton, flowLevel === level.value && { backgroundColor: level.color, borderColor: level.color }]}>
            <Text style={[styles.cycleButtonText, flowLevel === level.value && styles.cycleButtonTextActive]}>{level.label}</Text>
          </Pressable>
        ))}
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
  cycleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  cycleButton: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceElevated, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  cycleButtonText: { ...TYPOGRAPHY.label, color: COLORS.text },
  cycleButtonTextActive: { color: COLORS.white, fontWeight: '700' },
});
