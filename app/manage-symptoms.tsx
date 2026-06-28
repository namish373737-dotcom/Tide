import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, StatusBar } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

interface SymptomRow {
  id: number;
  name: string;
  display_name: string;
  is_enabled: number;
  is_custom: number;
}

export default function ManageSymptomsScreen() {
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([]);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SymptomRow>(
      'SELECT id, name, display_name, is_enabled, is_custom FROM symptoms ORDER BY is_custom DESC, display_name ASC'
    );
    setSymptoms(rows);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (s: SymptomRow) => {
    const db = await getDatabase();
    const next = s.is_enabled ? 0 : 1;
    await db.runAsync('UPDATE symptoms SET is_enabled = ? WHERE id = ?', [next, s.id]);
    setSymptoms(prev => prev.map(x => x.id === s.id ? { ...x, is_enabled: next } : x));
  };

  const addCustom = async () => {
    const name = newName.trim();
    if (!name) return;
    const db = await getDatabase();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    await db.runAsync(
      'INSERT INTO symptoms (condition_id, name, display_name, is_enabled, is_custom) VALUES (NULL, ?, ?, 1, 1)',
      [slug || name, name]
    );
    setNewName('');
    await load();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Symptoms</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>Enable, disable, or add custom symptoms to track.</Text>

        <View style={styles.list}>
          {symptoms.map(s => (
            <Pressable key={s.id} onPress={() => toggle(s)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowName}>{s.display_name}</Text>
              <View style={[styles.toggle, s.is_enabled ? styles.toggleActive : null]}>
                <View style={[styles.toggleDot, s.is_enabled ? styles.toggleDotActive : null]} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Add Custom Symptom</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Brain fog"
            placeholderTextColor={COLORS.textTertiary}
            style={styles.input}
          />
          <Pressable onPress={addCustom} disabled={!newName.trim()} style={({ pressed }) => [styles.addButton, !newName.trim() && styles.addButtonDisabled, pressed && newName.trim() && { opacity: 0.9 }]}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
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
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 24 },
  list: { gap: SPACING.sm, marginBottom: SPACING.xl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  rowName: { ...TYPOGRAPHY.body, color: COLORS.text, flex: 1 },
  toggle: { width: 48, height: 28, borderRadius: RADIUS.full, backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleDot: { width: 24, height: 24, borderRadius: RADIUS.full, backgroundColor: COLORS.white, ...SHADOWS.sm },
  toggleDotActive: { transform: [{ translateX: 20 }] },
  addCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  addTitle: { ...TYPOGRAPHY.h4, color: COLORS.text, marginBottom: SPACING.md },
  input: { height: 48, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.base, ...TYPOGRAPHY.body, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', ...SHADOWS.sm },
  addButtonDisabled: { backgroundColor: COLORS.border },
  addButtonText: { ...TYPOGRAPHY.button, color: COLORS.white },
});
