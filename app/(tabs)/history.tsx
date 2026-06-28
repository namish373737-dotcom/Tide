import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { format } from 'date-fns';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const settings = await db.getFirstAsync<{ pro_subscription_status: string }>(
        'SELECT pro_subscription_status FROM user_settings LIMIT 1'
      );
      const pro = settings?.pro_subscription_status === 'active';
      setIsPro(pro);

      let rows: any[];
      if (pro) {
        rows = await db.getAllAsync<any>(
          `SELECT de.*, (SELECT MAX(severity) FROM symptom_logs WHERE daily_entry_id = de.id) as max_severity, (SELECT COUNT(*) FROM symptom_logs WHERE daily_entry_id = de.id) as symptom_count FROM daily_entries de ORDER BY de.entry_date DESC LIMIT 1000`
        );
      } else {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceInt = since.getFullYear() * 10000 + (since.getMonth() + 1) * 100 + since.getDate();
        rows = await db.getAllAsync<any>(
          `SELECT de.*, (SELECT MAX(severity) FROM symptom_logs WHERE daily_entry_id = de.id) as max_severity, (SELECT COUNT(*) FROM symptom_logs WHERE daily_entry_id = de.id) as symptom_count FROM daily_entries de WHERE de.entry_date >= ? ORDER BY de.entry_date DESC`,
          [sinceInt]
        );
      }
      setEntries(rows); setLoading(false);
    }
    fetch();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>History</Text>

        {!isPro && (
          <View style={styles.proBanner}>
            <Text style={styles.proBannerText}>Viewing last 30 days — Upgrade to Pro for full history</Text>
            <Pressable onPress={() => router.push('/paywall')} style={styles.proBannerButton}>
              <Text style={styles.proBannerButtonText}>Upgrade</Text>
            </Pressable>
          </View>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={48} color={COLORS.primary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyDescription}>Start tracking to build your health history.</Text>
          </View>
        ) : (
          <View style={styles.entriesContainer}>
            {entries.map(entry => {
              const dateObj = new Date(Math.floor(entry.entry_date / 10000), Math.floor((entry.entry_date % 10000) / 100) - 1, entry.entry_date % 100);
              const isToday = isSameDay(dateObj, new Date());
              return (
                <Pressable key={entry.id} onPress={() => router.push(`/check-in/${entry.entry_date}`)} style={({ pressed }) => [styles.entryCard, pressed && styles.entryCardPressed]}>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryDate}>{isToday ? 'Today' : format(dateObj, 'EEEE, MMM d')}</Text>
                    <Text style={styles.entryMeta}>{entry.symptom_count > 0 ? `${entry.symptom_count} symptoms logged` : 'No symptoms logged'}</Text>
                    {entry.mood && <Text style={styles.entryMood}>Mood: {entry.mood}/5 • Energy: {entry.energy}/5</Text>}
                  </View>
                  <View style={styles.entryRight}>
                    {entry.max_severity !== null && (
                      <View style={[styles.severityBadge, entry.max_severity >= 7 ? styles.severityBadgeHigh : entry.max_severity >= 4 ? styles.severityBadgeMed : styles.severityBadgeLow]}>
                        <Text style={styles.severityBadgeText}>{entry.max_severity}</Text>
                      </View>
                    )}
                    <ChevronRight size={20} color={COLORS.textTertiary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xl },
  proBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.warningLight, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  proBannerText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, flex: 1, marginRight: SPACING.md, lineHeight: 20 },
  proBannerButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  proBannerButtonText: { ...TYPOGRAPHY.label, color: COLORS.white },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING['2xl'], alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  emptyDescription: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center' },
  entriesContainer: { gap: SPACING.base },
  entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  entryCardPressed: { opacity: 0.9, backgroundColor: COLORS.surfaceElevated },
  entryContent: { flex: 1 },
  entryDate: { ...TYPOGRAPHY.h4, color: COLORS.text, marginBottom: SPACING.xs },
  entryMeta: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginBottom: 2 },
  entryMood: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary },
  entryRight: { flexDirection: 'row', alignItems: 'center' },
  severityBadge: { width: 32, height: 32, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  severityBadgeHigh: { backgroundColor: COLORS.danger },
  severityBadgeMed: { backgroundColor: COLORS.warning },
  severityBadgeLow: { backgroundColor: COLORS.success },
  severityBadgeText: { ...TYPOGRAPHY.badge, color: COLORS.white },
});
