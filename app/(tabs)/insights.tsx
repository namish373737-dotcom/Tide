import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { getDatabase } from '@/lib/database/client';
import { TrendingUp, AlertCircle, Lock, Zap } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function InsightsScreen() {
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const db = await getDatabase();
      const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM daily_entries');
      setHasEnoughData((count?.count || 0) >= 7);
      const settings = await db.getFirstAsync<{ pro_subscription_status: string }>('SELECT pro_subscription_status FROM user_settings LIMIT 1');
      setIsPro(settings?.pro_subscription_status === 'active');

      if ((count?.count || 0) >= 7) {
        const entries = await db.getAllAsync<any>(
          `SELECT de.entry_date, sl.severity, s.name as symptom_name, s.display_name as symptom_display, t.display_name as trigger_display, tl.value
           FROM daily_entries de LEFT JOIN symptom_logs sl ON sl.daily_entry_id = de.id LEFT JOIN symptoms s ON s.id = sl.symptom_id
           LEFT JOIN trigger_logs tl ON tl.daily_entry_id = de.id LEFT JOIN triggers t ON t.id = tl.trigger_id ORDER BY de.entry_date DESC LIMIT 30`
        );
        const triggerInsight = generateTriggerInsight(entries);
        if (triggerInsight) setInsights([triggerInsight]);
      }
    }
    fetchData();
  }, []);

  if (!hasEnoughData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Insights</Text>
          <View style={styles.emptyCard}>
            <TrendingUp size={48} color={COLORS.primary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Keep logging to unlock insights</Text>
            <Text style={styles.emptyDescription}>Log at least 7 days of symptoms and triggers to start seeing personalized patterns about your health.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Insights</Text>

        {!isPro && (
          <View style={styles.proCard}>
            <View style={styles.proHeader}>
              <Lock size={20} color={COLORS.accent} />
              <Text style={styles.proTitle}>Pro Feature</Text>
            </View>
            <Text style={styles.proDescription}>Upgrade to Pro to see advanced correlations, cycle overlays, and medication efficacy reports.</Text>
            <Pressable style={({ pressed }) => [styles.proButton, pressed && styles.proButtonPressed]}>
              <Zap size={16} color={COLORS.white} />
              <Text style={styles.proButtonText}>Upgrade to Pro — $4.99/mo</Text>
            </Pressable>
          </View>
        )}

        {insights.map((insight, i) => (
          <View key={i} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <AlertCircle size={20} color={COLORS.primary} />
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </View>
        ))}

        {insights.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyDescription}>Log more symptoms and triggers to generate personalized insights.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function generateTriggerInsight(entries: any[]): { title: string; description: string } | null {
  const symptomMap: Record<string, { trigger: string; count: number; total: number }> = {};
  entries.forEach(row => {
    if (row.symptom_name && row.trigger_display && row.value === 'true') {
      const key = `${row.symptom_name}_${row.trigger_display}`;
      if (!symptomMap[key]) symptomMap[key] = { trigger: row.trigger_display, count: 0, total: 0 };
      if (row.severity >= 5) symptomMap[key].count++;
      symptomMap[key].total++;
    }
  });
  let bestInsight = null, bestRatio = 0;
  for (const [key, data] of Object.entries(symptomMap)) {
    if (data.total >= 3) {
      const ratio = data.count / data.total;
      if (ratio > bestRatio) { bestRatio = ratio; const symptomName = key.split('_')[0].replace(/_/g, ' '); bestInsight = { title: 'Trigger Pattern Found', description: `On ${Math.round(ratio * 100)}% of days you logged ${data.trigger}, your ${symptomName} severity was elevated. Keep tracking to confirm this pattern.` }; }
    }
  }
  return bestInsight;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xl },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING['2xl'], alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.sm, textAlign: 'center' },
  emptyDescription: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  proCard: { backgroundColor: 'rgba(155, 89, 182, 0.08)', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1.5, borderColor: 'rgba(155, 89, 182, 0.2)', ...SHADOWS.sm },
  proHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  proTitle: { ...TYPOGRAPHY.h4, color: COLORS.accent, marginLeft: SPACING.sm },
  proDescription: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 22 },
  proButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, ...SHADOWS.md },
  proButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  proButtonText: { ...TYPOGRAPHY.button, color: COLORS.white, marginLeft: SPACING.sm },
  insightCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  insightTitle: { ...TYPOGRAPHY.h4, color: COLORS.text, marginLeft: SPACING.sm },
  insightDescription: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 22 },
});
