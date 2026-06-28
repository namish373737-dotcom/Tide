import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useConditions } from '@/hooks/useEntities';
import { getDatabase } from '@/lib/database/client';
import { Check, ChevronRight } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function ConditionsScreen() {
  const { conditions, loading } = useConditions();
  const [selected, setSelected] = useState<number[]>([]);

  const toggleCondition = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM user_settings LIMIT 1');
    if (existing) {
      await db.runAsync(
        'UPDATE user_settings SET selected_conditions = ? WHERE id = ?',
        [JSON.stringify(selected), existing.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO user_settings (selected_conditions) VALUES (?)',
        [JSON.stringify(selected)]
      );
    }
    router.push('/onboarding/symptoms');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading conditions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>What are you living with?</Text>
        <Text style={styles.subtitle}>
          Select the conditions you want to track. You can add more later.
        </Text>

        <View style={styles.cardsContainer}>
          {conditions.map(condition => {
            const isSelected = selected.includes(condition.id);
            return (
              <Pressable
                key={condition.id}
                onPress={() => toggleCondition(condition.id)}
                style={({ pressed }) => [
                  styles.conditionCard,
                  isSelected && styles.conditionCardSelected,
                  pressed && styles.conditionCardPressed,
                ]}
              >
                <View style={styles.conditionContent}>
                  <Text style={[styles.conditionName, isSelected && styles.conditionNameSelected]}>
                    {condition.displayName}
                  </Text>
                  <Text style={styles.conditionDescription} numberOfLines={3}>
                    {condition.description}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}>
                  {isSelected && <Check size={16} color={COLORS.white} strokeWidth={3} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.selectedCount}>
          {selected.length} selected
        </Text>
        <Pressable
          onPress={handleContinue}
          disabled={selected.length === 0}
          style={({ pressed }) => [
            styles.continueButton,
            selected.length === 0 && styles.continueButtonDisabled,
            pressed && selected.length > 0 && styles.continueButtonPressed,
          ]}
        >
          <Text style={[
            styles.continueButtonText,
            selected.length === 0 && styles.continueButtonTextDisabled,
          ]}>
            Continue
          </Text>
          <ChevronRight
            size={20}
            color={selected.length > 0 ? COLORS.white : COLORS.textTertiary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: LAYOUT.safeTop,
    paddingBottom: 120,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: SPACING.base,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  conditionCardSelected: {
    backgroundColor: 'rgba(13, 115, 119, 0.06)',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  conditionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  conditionContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  conditionName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  conditionNameSelected: {
    color: COLORS.primary,
  },
  conditionDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: LAYOUT.safeBottom + SPACING.base,
    paddingTop: SPACING.base,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  selectedCount: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    ...SHADOWS.md,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
    ...SHADOWS.sm,
  },
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    marginRight: SPACING.xs,
  },
  continueButtonTextDisabled: {
    color: COLORS.textTertiary,
  },
});
