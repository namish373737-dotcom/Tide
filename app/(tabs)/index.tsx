import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSymptoms } from '@/hooks/useEntities';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import { getDatabase } from '@/lib/database/client';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Flame, TrendingUp, ChevronRight, Plus, FileText } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

function getTodayDateInt(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const today = getTodayDateInt();
  const { entry, symptomLogs, loading } = useDailyEntry(today);
  const { symptoms } = useSymptoms();
  const [streak, setStreak] = useState(0);
  const [weekData, setWeekData] = useState<{ date: number; logged: boolean; severity: number }[]>([]);

  useEffect(() => {
    async function calculateStreak() {
      const db = await getDatabase();
      const entries = await db.getAllAsync<{ entry_date: number }>('SELECT entry_date FROM daily_entries ORDER BY entry_date DESC');
      let currentStreak = 0;
      const todayDate = new Date();
      for (let i = 0; i < entries.length; i++) {
        const entryDate = new Date(Math.floor(entries[i].entry_date / 10000), Math.floor((entries[i].entry_date % 10000) / 100) - 1, entries[i].entry_date % 100);
        const expectedDate = subDays(todayDate, i);
        if (isSameDay(entryDate, expectedDate)) { currentStreak++; } else { break; }
      }
      setStreak(currentStreak);
    }
    calculateStreak();
  }, [entry]);

  useEffect(() => {
    async function fetchWeek() {
      const db = await getDatabase();
      const todayDate = new Date();
      const weekStart = startOfWeek(todayDate, { weekStartsOn: 1 });
      const days: { date: number; logged: boolean; severity: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i);
        const dateInt = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        const entryRow = await db.getFirstAsync<{ id: number }>('SELECT id FROM daily_entries WHERE entry_date = ?', [dateInt]);
        const maxSeverity = entryRow ? await db.getFirstAsync<{ max: number }>('SELECT MAX(severity) as max FROM symptom_logs WHERE daily_entry_id = ?', [entryRow.id]) : null;
        days.push({ date: dateInt, logged: !!entryRow, severity: maxSeverity?.max || 0 });
      }
      setWeekData(days);
    }
    fetchWeek();
  }, [entry]);

  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakContent}>
            <View style={styles.streakIcon}>
              <Flame size={28} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.streakText}>{streak} day streak</Text>
              <Text style={styles.streakSubtext}>
                {streak > 0 ? 'Keeping track of your health' : 'Start your streak today'}
              </Text>
            </View>
          </View>
        </View>

        {/* Week Overview */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {weekData.map((day, i) => {
              const d = new Date(Math.floor(day.date / 10000), Math.floor((day.date % 10000) / 100) - 1, day.date % 100);
              const isToday = isSameDay(d, new Date());
              return (
                <View key={i} style={styles.dayColumn}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>{format(d, 'EEE')[0]}</Text>
                  <View style={[
                    styles.dayDot,
                    isToday && styles.dayDotToday,
                    day.logged && (day.severity >= 7 ? styles.dayDotHigh : day.severity >= 4 ? styles.dayDotMed : styles.dayDotLow)
                  ]}>
                    {day.logged && <Text style={styles.daySeverity}>{day.severity}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Today's Check-in */}
        <View style={[styles.sectionCard, entry ? styles.loggedCard : styles.uncheckedCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Today's Check-in</Text>
            {entry && (
              <View style={styles.loggedBadge}>
                <Text style={styles.loggedBadgeText}>Logged</Text>
              </View>
            )}
          </View>
          
          {entry && symptomLogs.length > 0 ? (
            <View style={styles.symptomList}>
              {symptomLogs.slice(0, 3).map(log => {
                const symptom = symptoms.find(s => s.id === log.symptomId);
                if (!symptom) return null;
                return (
                  <View key={log.id} style={styles.symptomRow}>
                    <Text style={styles.symptomName}>{symptom.displayName}</Text>
                    <View style={styles.symptomValue}>
                      <View style={[styles.severityDot, log.severity >= 7 ? styles.severityHigh : log.severity >= 4 ? styles.severityMed : styles.severityLow]} />
                      <Text style={styles.severityText}>{log.severity}/10</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {entry ? 'No symptoms logged yet.' : 'Take a moment to check in — it helps you and your doctor.'}
            </Text>
          )}
          
          <Pressable onPress={() => router.push('/check-in/' + today)} style={({ pressed }) => [styles.checkInButton, pressed && styles.checkInButtonPressed]}>
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.checkInButtonText}>{entry ? 'Update Check-in' : 'Start Check-in'}</Text>
          </Pressable>
        </View>

        {/* Doctor Report */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <FileText size={20} color={COLORS.primary} strokeWidth={2} />
            <Text style={[styles.cardTitle, { marginLeft: SPACING.sm }]}>Doctor Report</Text>
          </View>
          <Text style={styles.cardDescription}>
            Generate a PDF of your symptom history to bring to your next appointment. Your data speaks for you.
          </Text>
          <Pressable onPress={() => router.push('/report')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <FileText size={18} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Generate PDF</Text>
          </Pressable>
        </View>

        {/* Insight Preview */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <TrendingUp size={20} color={COLORS.primary} strokeWidth={2} />
            <Text style={[styles.cardTitle, { marginLeft: SPACING.sm }]}>Insights</Text>
          </View>
          <Text style={styles.cardDescription}>
            Log 7 days of symptoms to discover patterns — like which foods or activities affect your pain levels.
          </Text>
          <Pressable onPress={() => router.push('/insights')} style={styles.linkRow}>
            <Text style={styles.linkText}>See all insights</Text>
            <ChevronRight size={16} color={COLORS.primary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  header: { marginBottom: SPACING.xl },
  greeting: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: 4 },
  date: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  streakCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS['2xl'], padding: SPACING.lg, marginBottom: SPACING.xl, ...SHADOWS.md },
  streakContent: { flexDirection: 'row', alignItems: 'center' },
  streakIcon: { width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  streakText: { ...TYPOGRAPHY.h3, color: COLORS.white },
  streakSubtext: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS['2xl'], padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  loggedCard: { borderColor: COLORS.success, borderWidth: 1.5 },
  uncheckedCard: { },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cardTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  loggedBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, marginLeft: 'auto' },
  loggedBadgeText: { ...TYPOGRAPHY.badge, color: COLORS.success },
  cardDescription: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACING.sm },
  dayColumn: { alignItems: 'center', width: 40 },
  dayLabel: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginBottom: SPACING.sm },
  dayLabelActive: { color: COLORS.primary, fontWeight: '600' },
  dayDot: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  dayDotToday: { borderWidth: 2, borderColor: COLORS.primary },
  dayDotHigh: { backgroundColor: COLORS.danger },
  dayDotMed: { backgroundColor: COLORS.warning },
  dayDotLow: { backgroundColor: COLORS.success },
  daySeverity: { ...TYPOGRAPHY.badge, color: COLORS.white, fontSize: 11 },
  symptomList: { marginBottom: SPACING.md },
  symptomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  symptomName: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  symptomValue: { flexDirection: 'row', alignItems: 'center' },
  severityDot: { width: 8, height: 8, borderRadius: RADIUS.full, marginRight: SPACING.sm },
  severityHigh: { backgroundColor: COLORS.danger },
  severityMed: { backgroundColor: COLORS.warning },
  severityLow: { backgroundColor: COLORS.success },
  severityText: { ...TYPOGRAPHY.label, color: COLORS.text },
  emptyText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  checkInButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, ...SHADOWS.md },
  checkInButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  checkInButtonText: { ...TYPOGRAPHY.button, color: COLORS.white, marginLeft: SPACING.sm },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13, 115, 119, 0.08)', borderRadius: RADIUS.lg, paddingVertical: SPACING.md, borderWidth: 1.5, borderColor: COLORS.primary },
  secondaryButtonPressed: { opacity: 0.8 },
  secondaryButtonText: { ...TYPOGRAPHY.button, color: COLORS.primary, marginLeft: SPACING.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  linkText: { ...TYPOGRAPHY.label, color: COLORS.primary },
});
