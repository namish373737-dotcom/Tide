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
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceInt = since.getFullYear() * 10000 + (since.getMonth() + 1) * 100 + since.getDate();
      const rows = await db.getAllAsync(
        `SELECT de.*, 
          (SELECT json_group_array(json_object('name', s.display_name, 'severity', sl.severity)) 
           FROM symptom_logs sl JOIN symptoms s ON s.id = sl.symptom_id 
           WHERE sl.daily_entry_id = de.id) as symptoms_json
         FROM daily_entries de
         WHERE de.entry_date >= ?
         ORDER BY de.entry_date DESC`,
        [sinceInt]
      );
      setEntries(rows);
      setLoading(false);
    }
    fetch();
  }, [days]);

  const generatePDF = async () => {
    const html = buildHTML(entries, days);
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

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Report Period</Text>
          <View style={styles.daysRow}>
            {[7, 30, 60, 90].map(d => (
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

function buildHTML(entries: any[], days: number): string {
  const since = subDays(new Date(), days);
  const sinceStr = format(since, 'MMM d, yyyy');
  const todayStr = format(new Date(), 'MMM d, yyyy');
  const todayDate = format(new Date(), 'MMMM d, yyyy');

  const rows = entries.map((e: any) => {
    const dateObj = new Date(Math.floor(e.entry_date / 10000), Math.floor((e.entry_date % 10000) / 100) - 1, e.entry_date % 100);
    const symptoms = JSON.parse(e.symptoms_json || '[]');
    const symptomText = symptoms.map((s: any) => `${s.name}: ${s.severity}/10`).join(', ') || 'None';
    return `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${format(dateObj, 'MMM d')}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${symptomText}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${e.mood || '-'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${e.energy || '-'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${e.notes || '-'}</td>
    </tr>`;
  }).join('');

  return `<html>
    <head>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; color: #1a1a2e; }
        h1 { color: #0d7377; font-size: 28px; margin-bottom: 8px; }
        .subtitle { color: #5a5a7a; font-size: 14px; margin-bottom: 30px; }
        .date-range { font-size: 16px; margin-bottom: 20px; }
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
      <table>
        <tr><th>Date</th><th>Symptoms</th><th>Mood</th><th>Energy</th><th>Notes</th></tr>
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
