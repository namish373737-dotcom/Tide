import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';

type FlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

const FLOW_COLORS: Record<string, string> = {
  heavy: '#E53E3E',
  medium: '#F6AD55',
  light: '#FBD38D',
  spotting: '#FED7D7',
  none: COLORS.border,
};

const PHASE_LABELS: Record<string, string> = {
  menstrual: 'M',
  follicular: 'F',
  ovulatory: 'O',
  luteal: 'L',
};

const LEGEND: { value: FlowLevel; label: string }[] = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DayData {
  flow: string | null;
  phase: string | null;
}

function dateToInt(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function monthsBack(today: Date, count: number): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return out;
}

export default function CycleScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<number, DayData>>({});
  const today = new Date();
  const months = monthsBack(today, 3);

  const load = useCallback(async () => {
    setLoading(true);
    const db = await getDatabase();
    const earliest = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const earliestInt = dateToInt(earliest);
    const rows = await db.getAllAsync<{ entry_date: number; flow_level: string | null; phase: string | null }>(
      `SELECT de.entry_date, cl.flow_level, cl.phase
       FROM daily_entries de
       INNER JOIN cycle_logs cl ON cl.daily_entry_id = de.id
       WHERE de.entry_date >= ?`,
      [earliestInt]
    );
    const map: Record<number, DayData> = {};
    for (const r of rows) {
      map[r.entry_date] = { flow: r.flow_level, phase: r.phase };
    }
    setData(map);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Cycle</Text>

        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Flow Level</Text>
          <View style={styles.legendRow}>
            {LEGEND.map(item => (
              <View key={item.value} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: FLOW_COLORS[item.value] }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
        ) : Object.keys(data).length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No cycle data yet</Text>
            <Text style={styles.emptyText}>Log your flow on the daily check-in to see it appear here.</Text>
          </View>
        ) : null}

        {months.map(m => (
          <MonthGrid key={`${m.year}-${m.month}`} year={m.year} month={m.month} data={data} today={today} />
        ))}
      </ScrollView>
    </View>
  );
}

function MonthGrid({ year, month, data, today }: { year: number; month: number; data: Record<number, DayData>; today: Date }) {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.monthCard}>
      <Text style={styles.monthTitle}>{monthName}</Text>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekdayLabel}>{w}</Text>
        ))}
      </View>
      <View style={styles.daysGrid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={styles.dayCellEmpty} />;
          const cellDate = new Date(year, month, d);
          const dateInt = dateToInt(cellDate);
          const isFuture = cellDate > today;
          const dayData = data[dateInt];
          const bg = dayData?.flow ? FLOW_COLORS[dayData.flow] : COLORS.border;
          return (
            <Pressable
              key={i}
              disabled={isFuture}
              onPress={() => router.push(`/check-in/${dateInt}`)}
              style={[styles.dayCell, { backgroundColor: bg }, isFuture && styles.dayCellFuture]}
            >
              <Text style={[styles.dayNumber, dayData?.flow && (dayData.flow === 'heavy' || dayData.flow === 'medium') && styles.dayNumberOnDark]}>{d}</Text>
              {dayData?.phase && <Text style={styles.phaseLabel}>{PHASE_LABELS[dayData.phase] ?? ''}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xl },
  center: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  legendCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  legendTitle: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendSwatch: { width: 16, height: 16, borderRadius: RADIUS.sm },
  legendLabel: { ...TYPOGRAPHY.caption, color: COLORS.text },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { ...TYPOGRAPHY.h4, color: COLORS.text, marginBottom: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center' },
  monthCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  monthTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.md },
  weekdayRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  weekdayLabel: { flex: 1, textAlign: 'center', ...TYPOGRAPHY.caption, color: COLORS.textTertiary, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  dayCellEmpty: { width: `${100 / 7}%`, aspectRatio: 1 },
  dayCellFuture: { opacity: 0.3 },
  dayNumber: { ...TYPOGRAPHY.bodySmall, color: COLORS.text, fontWeight: '500' },
  dayNumberOnDark: { color: COLORS.white },
  phaseLabel: { ...TYPOGRAPHY.caption, fontSize: 9, color: COLORS.textSecondary, fontWeight: '700' },
});
