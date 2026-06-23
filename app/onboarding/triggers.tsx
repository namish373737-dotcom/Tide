import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { Check, ChevronRight } from 'lucide-react-native';
import { Trigger } from '@/types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function TriggersScreen() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const rows = await db.getAllAsync<Trigger>(
        'SELECT id, name, display_name as displayName, category, input_type as inputType, is_enabled as isEnabled, is_custom as isCustom, sort_order as sortOrder, created_at as createdAt FROM triggers ORDER BY sort_order'
      );
      setTriggers(rows); setLoading(false);
    }
    fetch();
  }, []);

  const toggleTrigger = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleContinue = async () => {
    const db = await getDatabase();
    for (const id of selected) { await db.runAsync('UPDATE triggers SET is_enabled = 1 WHERE id = ?', [id]); }
    const latest = await db.getFirstAsync<{ id: number }>('SELECT id FROM user_settings ORDER BY id DESC LIMIT 1');
    if (latest) {
      await db.runAsync('UPDATE user_settings SET onboarding_complete = 1 WHERE id = ?', [latest.id]);
    }
    router.replace('/(tabs)');
  };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.center}><Text style={styles.loadingText}>Loading triggers...</Text></View>
    </View>
  );

  const categoryIcons: Record<string, string> = {
    diet: '🍽️', lifestyle: '☀️', stress: '😰', sleep: '😴', medication: '💊', environmental: '🌤️'
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>What might affect your symptoms?</Text>
        <Text style={styles.subtitle}>Select triggers to track — we'll help you find patterns.</Text>

        <View style={styles.cardsContainer}>
          {triggers.map(trigger => {
            const isSelected = selected.includes(trigger.id);
            const icon = categoryIcons[trigger.category || ''] || '•';
            return (
              <Pressable key={trigger.id} onPress={() => toggleTrigger(trigger.id)}
                style={({ pressed }) => [styles.card, isSelected && styles.cardSelected, pressed && styles.cardPressed]}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardIcon}>{icon}</Text>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardName, isSelected && styles.cardNameSelected]}>{trigger.displayName}</Text>
                    <Text style={styles.cardCategory}>{(trigger.category || '').replace('_', ' ')}</Text>
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
        <Pressable onPress={handleContinue}
          style={({ pressed }) => [styles.continueButton, pressed && styles.continueButtonPressed]}>
          <Text style={styles.continueButtonText}>{selected.length > 0 ? 'Start Tracking' : 'Skip for Now'}</Text>
          <ChevronRight size={20} color={COLORS.white} />
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
  cardIcon: { fontSize: 22, marginRight: SPACING.sm, width: 30 },
  cardContent: { flex: 1 },
  cardName: { ...TYPOGRAPHY.h4, color: COLORS.text, marginBottom: 2 },
  cardNameSelected: { color: COLORS.primary },
  cardCategory: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, textTransform: 'capitalize' },
  checkbox: { width: 28, height: 28, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: LAYOUT.screenPadding, paddingBottom: LAYOUT.safeBottom + SPACING.base, paddingTop: SPACING.base, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.divider },
  selectedCount: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  continueButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, ...SHADOWS.md },
  continueButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  continueButtonText: { ...TYPOGRAPHY.button, color: COLORS.white, marginRight: SPACING.xs },
});
