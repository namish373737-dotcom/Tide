import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, StatusBar } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

interface TriggerRow {
  id: number;
  name: string;
  display_name: string;
  is_enabled: number;
  is_custom: number;
}

export default function ManageTriggersScreen() {
  const [triggers, setTriggers] = useState<TriggerRow[]>([]);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TriggerRow>(
      'SELECT id, name, display_name, is_enabled, is_custom FROM triggers ORDER BY is_custom DESC, display_name ASC'
    );
    setTriggers(rows);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteCustom = async (id: number) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE triggers SET is_enabled = 0, is_custom = 0 WHERE id = ? AND is_custom = 1', [id]);
    setTriggers(prev => prev.filter(t => t.id !== id));
  };

  const toggle = async (t: TriggerRow) => {
    const db = await getDatabase();
    const next = t.is_enabled ? 0 : 1;
    await db.runAsync('UPDATE triggers SET is_enabled = ? WHERE id = ?', [next, t.id]);
    setTriggers(prev => prev.map(x => x.id === t.id ? { ...x, is_enabled: next } : x));
  };

  const addCustom = async () => {
    const name = newName.trim();
    if (!name) return;
    const db = await getDatabase();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    await db.runAsync(
      "INSERT INTO triggers (name, display_name, input_type, is_enabled, is_custom) VALUES (?, ?, 'boolean', 1, 1)",
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
        <Text style={styles.headerTitle}>Triggers</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>Enable, disable, or add custom triggers to track.</Text>

        <View style={styles.list}>
          {triggers.map(t => (
            <Pressable key={t.id} onPress={() => toggle(t)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowName}>{t.display_name}</Text>
              <View style={[styles.toggle, t.is_enabled ? styles.toggleActive : null]}>
                <View style={[styles.toggleDot, t.is_enabled ? styles.toggleDotActive : null]} />
              </View>
              {t.is_custom === 1 && (
                <Pressable onPress={() => deleteCustom(t.id)} style={styles.deleteButton}>
                  <Trash2 size={18} color={COLORS.danger} />
                </Pressable>
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Add Custom Trigger</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Skipped meal"
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
  deleteButton: { padding: SPACING.sm, marginLeft: SPACING.sm },
});
