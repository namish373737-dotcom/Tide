import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, Alert, StatusBar } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { ChevronLeft, Plus, Trash2, Pill } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newFrequency, setNewFrequency] = useState('daily');

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const rows = await db.getAllAsync('SELECT id, name, dosage, frequency, is_active FROM medications WHERE is_active = 1 ORDER BY created_at DESC');
      setMedications(rows);
    }
    fetch();
  }, []);

  const addMedication = async () => {
    if (!newName.trim()) return;
    const db = await getDatabase();
    await db.runAsync('INSERT INTO medications (name, dosage, frequency, is_active) VALUES (?, ?, ?, 1)', [newName.trim(), newDose.trim() || null, newFrequency]);
    const rows = await db.getAllAsync('SELECT id, name, dosage, frequency, is_active FROM medications WHERE is_active = 1 ORDER BY created_at DESC');
    setMedications(rows);
    setNewName('');
    setNewDose('');
    setShowAdd(false);
  };

  const deleteMedication = (id: number) => {
    Alert.alert('Delete Medication', 'Remove this medication from tracking?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const db = await getDatabase();
        await db.runAsync('UPDATE medications SET is_active = 0 WHERE id = ?', [id]);
        setMedications(prev => prev.filter(m => m.id !== id));
      }},
    ]);
  };

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'as_needed', label: 'As Needed' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Medications</Text>
        <Pressable onPress={() => setShowAdd(!showAdd)} style={styles.backButton}>
          <Plus size={24} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          Track medications and supplements to see if they help your symptoms.
        </Text>

        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Add Medication</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Medication name (e.g., Metformin)" placeholderTextColor={COLORS.textTertiary} style={styles.input} />
            <TextInput value={newDose} onChangeText={setNewDose} placeholder="Dose (e.g., 500mg)" placeholderTextColor={COLORS.textTertiary} style={styles.input} />
            <Text style={styles.freqLabel}>Frequency</Text>
            <View style={styles.freqRow}>
              {frequencies.map(f => (
                <Pressable key={f.value} onPress={() => setNewFrequency(f.value)} style={[styles.freqButton, newFrequency === f.value && styles.freqButtonActive]}>
                  <Text style={[styles.freqButtonText, newFrequency === f.value && styles.freqButtonTextActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={addMedication} disabled={!newName.trim()} style={({ pressed }) => [styles.addButton, !newName.trim() && styles.addButtonDisabled, pressed && newName.trim() && styles.addButtonPressed]}>
              <Text style={styles.addButtonText}>Add Medication</Text>
            </Pressable>
          </View>
        )}

        {medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Pill size={48} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptyDescription}>Tap the + button to add medications or supplements you want to track.</Text>
          </View>
        ) : (
          <View style={styles.medsList}>
            {medications.map((med: any) => (
              <View key={med.id} style={styles.medCard}>
                <View style={styles.medLeft}>
                  <Pill size={20} color={COLORS.primary} />
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    {med.dosage && <Text style={styles.medDose}>{med.dosage}</Text>}
                    <Text style={styles.medFreq}>{med.frequency?.replace('_', ' ')}</Text>
                  </View>
                </View>
                <Pressable onPress={() => deleteMedication(med.id)} style={styles.deleteButton}>
                  <Trash2 size={18} color={COLORS.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: SPACING.base },
  backButton: { padding: SPACING.sm, width: 44 },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1, textAlign: 'center' },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.xl, lineHeight: 24 },
  addCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS['2xl'], padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  addTitle: { ...TYPOGRAPHY.h4, color: COLORS.text, marginBottom: SPACING.md },
  input: { height: 48, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.base, ...TYPOGRAPHY.body, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  freqLabel: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  freqButton: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border },
  freqButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  freqButtonText: { ...TYPOGRAPHY.label, color: COLORS.text },
  freqButtonTextActive: { color: COLORS.white },
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', ...SHADOWS.sm },
  addButtonDisabled: { backgroundColor: COLORS.border },
  addButtonPressed: { opacity: 0.9 },
  addButtonText: { ...TYPOGRAPHY.button, color: COLORS.white },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS['2xl'], padding: SPACING['2xl'], alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  emptyDescription: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center' },
  medsList: { gap: SPACING.base },
  medCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  medLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  medInfo: { marginLeft: SPACING.sm, flex: 1 },
  medName: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '600' },
  medDose: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  medFreq: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, textTransform: 'capitalize', marginTop: 2 },
  deleteButton: { padding: SPACING.sm },
});
