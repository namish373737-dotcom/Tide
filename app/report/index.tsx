import { View, Text, Pressable, ScrollView, StyleSheet, Alert, StatusBar } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, subDays } from 'date-fns';
import { FileText, ChevronLeft, Share2 } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '@/lib/constants';

export default function ReportScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    async function checkPro() {
      const db = await getDatabase();
      const settings = await db.getFirstAsync<{ pro_subscription_status: string }>(
        'SELECT pro_subscription_status FROM user_settings LIMIT 1'
      );
      const pro = settings?.pro_subscription_status === 'active';
      setIsPro(pro);
      if (!pro) setDays(7);
    }
    checkPro();
  }, []);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceInt = since.getFullYear() * 10000 + (since.getMonth() + 1) * 100 + since.getDate();
      const rows = await db.getAllAsync<any>(
        `SELECT de.entry_date, de.notes, de.mood, de.energy, de.sleep_hours,
          (SELECT json_group_array(json_object('name', s.display_name, 'severity', sl.severity))
           FROM symptom_logs sl JOIN symptoms s ON s.id = sl.symptom_id
           WHERE sl.daily_entry_id = de.id) as symptoms_json,
          (SELECT json_group_array(t.display_name)
           FROM trigger_logs tl JOIN triggers t ON t.id = tl.trigger_id
           WHERE tl.daily_entry_id = de.id AND tl.value != 'false' AND tl.value != '0' AND tl.value IS NOT NULL) as triggers_json,
          (SELECT json_group_array(m.name)
           FROM medication_logs ml JOIN medications m ON m.id = ml.medication_id
           WHERE ml.daily_entry_id = de.id AND ml.taken = 1) as medications_json,
          (SELECT flow_level FROM cycle_logs WHERE daily_entry_id = de.id) as cycle_flow_level,
          (SELECT phase FROM cycle_logs WHERE daily_entry_id = de.id) as cycle_phase
         FROM daily_entries de
         WHERE de.entry_date >= ?
         ORDER BY de.entry_date DESC`,
        [sinceInt]
      );
      setEntries(rows);

      const medRows = await db.getAllAsync<any>(
        `SELECT m.id, m.name,
           COUNT(ml.id) as logged_days,
           SUM(CASE WHEN ml.taken = 1 THEN 1 ELSE 0 END) as taken_days
         FROM medications m
         LEFT JOIN medication_logs ml ON ml.medication_id = m.id
           AND ml.daily_entry_id IN (SELECT id FROM daily_entries WHERE entry_date >= ?)
         WHERE m.is_active = 1
         GROUP BY m.id`,
        [sinceInt]
      );
      setMedications(medRows);

      setLoading(false);
    }
    fetch();
  }, [days]);

  const generatePDF = async () => {
    const html = buildHTML(entries, medications, days);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Export Report</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>Generate a PDF report for your next doctor appointment.</Text>

        {!isPro && (
          <View style={styles.proBanner}>
            <Text style={styles.proBannerText}>Upgrade to Pro for 30/60/90-day reports</Text>
            <Pressable onPress={() => router.push('/paywall')} style={styles.proBannerButton}>
              <Text style={styles.proBannerButtonText}>Upgrade</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Report Period</Text>
          <View style={styles.daysRow}>
            {(isPro ? [7, 30, 60, 90] : [7]).map(d => (
              <Pressable key={d} onPress={() => setDays(d)} style={[styles.dayButton, days === d && styles.dayButtonActive]}>
                <Text style={[styles.dayButtonText, days === d && styles.dayButtonTextActive]}>{d} days</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Preview</Text>
          <Text style={styles.previewCount}>{entries.length}</Text>
          <Text style={styles.previewLabel}>entries in this period</Text>
        </View>

        <Pressable onPress={generatePDF} style={({ pressed }) => [styles.generateButton, pressed && styles.generateButtonPressed]}>
          <FileText size={18} color={COLORS.white} />
          <Text style={styles.generateButtonText}>Generate PDF</Text>
        </Pressable>

        <Text style={styles.footerNote}>Your PDF is generated locally on your device and is never uploaded.</Text>
      </ScrollView>
    </View>
  );
}

function buildHTML(entries: any[], medications: any[], days: number): string {
  const since = subDays(new Date(), days);
  const sinceStr = format(since, 'MMM d, yyyy');
  const todayStr = format(new Date(), 'MMM d, yyyy');
  const todayDate = format(new Date(), 'MMMM d, yyyy');

  const totalLogged = medications.reduce((sum, m) => sum + (m.logged_days || 0), 0);
  const totalTaken = medications.reduce((sum, m) => sum + (m.taken_days || 0), 0);
  const overallAdherence = totalLogged > 0 ? Math.round((totalTaken / totalLogged) * 100) : null;

  const medicationsSection = medications.length === 0 ? '' : `
    <div class="med-summary">
      <h2>Medications</h2>
      <p><strong>Overall Adherence:</strong> ${overallAdherence !== null ? overallAdherence + '%' : 'No data'}</p>
      <ul>
        ${medications.map((m: any) => {
          const pct = m.logged_days > 0 ? Math.round((m.taken_days / m.logged_days) * 100) : null;
          return `<li>${m.name}: ${pct !== null ? pct + '% adherence' : 'No data'}</li>`;
        }).join('')}
      </ul>
    </div>`;

  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cellStyle = 'padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; vertical-align: top;';
  const detailStyle = 'padding: 10px 14px 16px; background: #f7f7fb; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1a1a2e; line-height: 1.5;';

  const rows = entries.map((e: any) => {
    const dateObj = new Date(Math.floor(e.entry_date / 10000), Math.floor((e.entry_date % 10000) / 100) - 1, e.entry_date % 100);
    const symptoms = JSON.parse(e.symptoms_json || '[]');
    const triggers = JSON.parse(e.triggers_json || '[]');
    const medsTaken = JSON.parse(e.medications_json || '[]');
    const peakSeverity = symptoms.length > 0 ? Math.max(...symptoms.map((s: any) => s.severity)) : null;
    const cycleParts = [e.cycle_flow_level, e.cycle_phase].filter(Boolean);
    const cycleText = cycleParts.length > 0 ? cycleParts.join(' / ') : '-';
    const symptomText = symptoms.length > 0 ? symptoms.map((s: any) => `${escapeHtml(s.name)}: ${s.severity}/10`).join(', ') : 'None';
    const triggerText = triggers.length > 0 ? triggers.map((t: string) => escapeHtml(t)).join(', ') : 'None';
    const medsText = medsTaken.length > 0 ? medsTaken.map((m: string) => escapeHtml(m)).join(', ') : 'None';
    const notesText = e.notes ? escapeHtml(e.notes) : '—';
    return `<tr>
      <td style="${cellStyle}">${format(dateObj, 'MMM d')}</td>
      <td style="${cellStyle}">${peakSeverity !== null ? peakSeverity + '/10' : '-'}</td>
      <td style="${cellStyle}">${e.mood ? e.mood + '/5' : '-'}</td>
      <td style="${cellStyle}">${e.sleep_hours ? e.sleep_hours + 'h' : '-'}</td>
      <td style="${cellStyle}">${cycleText}</td>
    </tr>
    <tr><td colspan="5" style="${detailStyle}">
      <div><strong>Symptoms:</strong> ${symptomText}</div>
      <div><strong>Triggers:</strong> ${triggerText}</div>
      <div><strong>Meds taken:</strong> ${medsText}</div>
      <div><strong>Notes:</strong> ${notesText}</div>
    </td></tr>`;
  }).join('');

  return `<html>
    <head>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; color: #1a1a2e; }
        h1 { color: #0d7377; font-size: 28px; margin-bottom: 8px; }
        h2 { color: #0d7377; font-size: 18px; margin-bottom: 8px; }
        .subtitle { color: #5a5a7a; font-size: 14px; margin-bottom: 30px; }
        .date-range { font-size: 16px; margin-bottom: 20px; }
        .med-summary { margin-bottom: 20px; padding: 16px; background: #f7f7fb; border-radius: 8px; }
        .med-summary ul { margin: 8px 0 0; padding-left: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #0d7377; color: white; padding: 12px; text-align: left; font-size: 14px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #5a5a7a; }
      </style>
    </head>
    <body>
      <h1>${APP_NAME} Health Report</h1>
      <p class="subtitle">Generated by ${APP_NAME} — ${APP_TAGLINE}</p>
      <p class="date-range"><strong>Date Range:</strong> ${sinceStr} — ${todayStr}</p>
      <p><strong>Total Entries:</strong> ${entries.length}</p>
      ${medicationsSection}
      <table>
        <tr><th>Date</th><th>Peak Severity</th><th>Mood</th><th>Sleep</th><th>Cycle</th></tr>
        ${rows}
      </table>
      <div class="footer">
        <p><strong>Medical Disclaimer:</strong> This report is for informational purposes only. Always consult a healthcare professional.</p>
        <p>Generated on ${todayDate} using ${APP_NAME} v${APP_VERSION}</p>
      </div>
    </body>
  </html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: SPACING.base },
  backButton: { padding: SPACING.sm, width: 44 },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1, textAlign: 'center' },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  description: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.xl, lineHeight: 24 },
  proBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.warningLight, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  proBannerText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, flex: 1, marginRight: SPACING.md, lineHeight: 20 },
  proBannerButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  proBannerButtonText: { ...TYPOGRAPHY.label, color: COLORS.white },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  cardLabel: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: SPACING.md },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  dayButton: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceElevated, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  dayButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayButtonText: { ...TYPOGRAPHY.button, color: COLORS.text },
  dayButtonTextActive: { color: COLORS.white },
  previewCount: { ...TYPOGRAPHY.display, color: COLORS.primary, marginBottom: SPACING.xs },
  previewLabel: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: LAYOUT.buttonHeight, ...SHADOWS.md },
  generateButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  generateButtonText: { ...TYPOGRAPHY.button, color: COLORS.white, marginLeft: SPACING.sm },
  footerNote: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 18 },
});
