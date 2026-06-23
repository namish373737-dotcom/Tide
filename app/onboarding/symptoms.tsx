import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { Check, ChevronRight } from 'lucide-react-native';
import { Symptom } from '@/types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function SymptomsScreen() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const settings = await db.getFirstAsync<{ selected_conditions: string }>(
        'SELECT selected_conditions FROM user_settings ORDER BY id DESC LIMIT 1'
      );
      const conditionIds = settings?.selected_conditions ? JSON.parse(settings.selected_conditions) : [];
      if (conditionIds.length === 0) { setSymptoms([]); setLoading(false); return; }
      const placeholders = conditionIds.map(() => '?').join(',');
      const rows = await db.getAllAsync<Symptom>(
        `SELECT id, condition_id as conditionId, name, display_name as displayName, description, category, is_enabled as isEnabled, is_custom as isCustom, sort_order as sortOrder, created_at as createdAt FROM symptoms WHERE condition_id IN (${placeholders}) ORDER BY sort_order`, conditionIds
      );
      setSymptoms(rows); setLoading(false);
    }
    fetch();
  }, []);

  const toggleSymptom = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    const db = await getDatabase();
    for (const id of selected) { await db.runAsync('UPDATE symptoms SET is_enabled = 1 WHERE id = ?', [id]); }
    router.push('/onboarding/triggers');
  };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.center}><Text style={styles.loadingText}>Loading symptoms...</Text></View>
    </View>
  );

  const categoryColors: Record<string, string> = {
    pain: '#FF6B6B', digestive: '#F59E0B', energy: '#10B981', cognitive: '#3B82F6',
    mood: '#9B59B6', reproductive: '#EC4899', skin: '#F97316', metabolic: '#06B6D4',
    diet: '#84CC16', sleep: '#6366F1', lifestyle: '#8B5CF6', environmental: '#14B8A6',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Which symptoms matter to you?</Text>
        <Text style={styles.subtitle}>Select the symptoms you want to track daily. You can add more later.</Text>

        <View style={styles.cardsContainer}>
          {symptoms.map(symptom => {
            const isSelected = selected.includes(symptom.id);
            const catColor = categoryColors[symptom.category || ''] || COLORS.textTertiary;
            return (
              <Pressable key={symptom.id} onPress={() => toggleSymptom(symptom.id)}
                style={({ pressed }) => [styles.card, isSelected && styles.cardSelected, pressed && styles.cardPressed]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardName, isSelected && styles.cardNameSelected]}>{symptom.displayName}</Text>
                    <Text style={styles.cardCategory}>{(symptom.category || '').replace('_', ' ')}</Text>
                  </View>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Check size={16} color={COLORS.white} strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.selectedCount}>{selected.length} selected</Text>
        <Pressable onPress={handleContinue} disabled={selected.length === 0}
          style={({ pressed }) => [styles.continueButton, selected.length === 0 && styles.continueButtonDisabled, pressed && selected.length > 0 && styles.continueButtonPressed]}>
          <Text style={[styles.continueButtonText, selected.length === 0 && styles.continueButtonTextDisabled]}>Continue</Text>
          <ChevronRight size={20} color={selected.length > 0 ? COLORS.white : COLORS.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: 120 },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.xl, lineHeight: 24 },
  cardsContainer: { gap: SPACING.base },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.sm },
  cardSelected: { backgroundColor: 'rgba(13, 115, 119, 0.06)', borderColor: COLORS.primary, borderWidth: 2 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  categoryDot: { width: 10, height: 10, borderRadius: RADIUS.full, marginRight: SPACING.sm },
  cardContent: { flex: 1 },
  cardName: { ...TYPOGRAPHY.h4, color: COLORS.text, marginBottom: 2 },
  cardNameSelected: { color: COLORS.primary },
  cardCategory: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, textTransform: 'capitalize' },
  checkbox: { width: 28, height: 28, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: LAYOUT.screenPadding, paddingBottom: LAYOUT.safeBottom + SPACING.base, paddingTop: SPACING.base, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.divider },
  selectedCount: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  continueButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, ...SHADOWS.md },
  continueButtonDisabled: { backgroundColor: COLORS.border, ...SHADOWS.sm },
  continueButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  continueButtonText: { ...TYPOGRAPHY.button, color: COLORS.white, marginRight: SPACING.xs },
  continueButtonTextDisabled: { color: COLORS.textTertiary },
});
