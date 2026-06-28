import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { TrendingUp, Lock, Zap, Moon, RefreshCw } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';
import { generateInsights, getCachedInsights, Insight } from '@/lib/insights';
import { format } from 'date-fns';

export default function InsightsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getDatabase();
      const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM daily_entries');
      const enough = (count?.count || 0) >= 7;
      setHasEnoughData(enough);
      const settings = await db.getFirstAsync<{ pro_subscription_status: string }>('SELECT pro_subscription_status FROM user_settings LIMIT 1');
      setIsPro(settings?.pro_subscription_status === 'active');

      if (enough) {
        const cached = await getCachedInsights(db);
        if (cached.insights.length > 0 && cached.generatedAt && (Date.now() / 1000 - cached.generatedAt < 24 * 60 * 60)) {
          setInsights(cached.insights);
          setGeneratedAt(cached.generatedAt);
        } else {
          const fresh = await generateInsights(db);
          setInsights(fresh);
          setGeneratedAt(Math.floor(Date.now() / 1000));
        }
      }
    } catch (e) {
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const db = await getDatabase();
      const fresh = await generateInsights(db);
      setInsights(fresh);
      setGeneratedAt(Math.floor(Date.now() / 1000));
    } catch (e) {
      Alert.alert('Refresh failed', 'Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Insights</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyDescription}>{error}</Text>
            <Pressable
              onPress={() => { setError(null); load(); }}
              style={({ pressed }) => [styles.proButton, pressed && styles.pressed, { marginTop: SPACING.lg }]}
            >
              <Text style={styles.proButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

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

  const visibleCount = isPro ? insights.length : Math.min(1, insights.length);
  const lockedCount = isPro ? 0 : Math.max(0, insights.length - 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Insights</Text>
          <Pressable onPress={handleRefresh} disabled={refreshing} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
            {refreshing ? <ActivityIndicator size="small" color={COLORS.primary} /> : <RefreshCw size={18} color={COLORS.primary} />}
          </Pressable>
        </View>

        {generatedAt && (
          <Text style={styles.timestamp}>Last updated {format(new Date(generatedAt * 1000), 'MMM d, h:mm a')}</Text>
        )}

        {insights.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyDescription}>No patterns detected yet. Keep logging — clearer signals appear after a few weeks of consistent data.</Text>
          </View>
        )}

        {insights.slice(0, visibleCount).map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}

        {lockedCount > 0 && (
          <>
            {Array.from({ length: lockedCount }).map((_, i) => (
              <View key={`locked-${i}`} style={styles.lockedCard}>
                <Lock size={20} color={COLORS.accent} />
                <Text style={styles.lockedTitle}>Pro insight locked</Text>
                <Text style={styles.lockedText}>Upgrade to Pro to see all {insights.length} personalized insights.</Text>
              </View>
            ))}
            <Pressable onPress={() => router.push('/paywall')} style={({ pressed }) => [styles.proButton, pressed && styles.pressed]}>
              <Zap size={16} color={COLORS.white} />
              <Text style={styles.proButtonText}>Upgrade to Pro</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = insight.insightType === 'correlation' ? Zap : insight.insightType === 'trend' ? TrendingUp : Moon;
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Icon size={20} color={COLORS.primary} />
        <Text style={styles.insightTitle}>{insight.title}</Text>
      </View>
      <Text style={styles.insightDescription}>{insight.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  refreshButton: { padding: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceElevated },
  pressed: { opacity: 0.7 },
  timestamp: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginBottom: SPACING.xl },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING['2xl'], alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.sm, textAlign: 'center' },
  emptyDescription: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  insightCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.base, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.sm },
  insightTitle: { ...TYPOGRAPHY.h4, color: COLORS.text, flex: 1 },
  insightDescription: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 22 },
  lockedCard: { backgroundColor: 'rgba(155, 89, 182, 0.06)', borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.base, borderWidth: 1.5, borderColor: 'rgba(155, 89, 182, 0.2)', alignItems: 'center', gap: SPACING.xs },
  lockedTitle: { ...TYPOGRAPHY.h4, color: COLORS.accent },
  lockedText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center' },
  proButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, marginTop: SPACING.md, ...SHADOWS.md, gap: SPACING.sm },
  proButtonText: { ...TYPOGRAPHY.button, color: COLORS.white },
});
