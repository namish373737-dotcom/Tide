import type * as SQLite from 'expo-sqlite';
import { sampleCorrelation, mean } from 'simple-statistics';

export interface Insight {
  insightType: 'correlation' | 'trend' | 'cycle' | 'medication';
  title: string;
  description: string;
  severity: 'info' | 'positive' | 'warning' | 'action' | null;
  dataJson: string | null;
}

interface DayRow {
  id: number;
  entry_date: number;
}
interface SymptomRow { daily_entry_id: number; symptom_id: number; severity: number; symptom_name: string; }
interface TriggerRow { daily_entry_id: number; trigger_id: number; value: string; trigger_name: string; }
interface CycleRow { daily_entry_id: number; phase: string | null; }

function dateIntToDate(n: number): Date {
  const y = Math.floor(n / 10000);
  const m = Math.floor((n % 10000) / 100) - 1;
  const d = n % 100;
  return new Date(y, m, d);
}

export async function generateInsights(db: SQLite.SQLiteDatabase): Promise<Insight[]> {
  const today = new Date();
  const since = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90);
  const sinceInt = since.getFullYear() * 10000 + (since.getMonth() + 1) * 100 + since.getDate();

  const entries = await db.getAllAsync<DayRow>(
    'SELECT id, entry_date FROM daily_entries WHERE entry_date >= ? ORDER BY entry_date ASC',
    [sinceInt]
  );
  if (entries.length === 0) return [];
  const entryIds = entries.map(e => e.id);
  const placeholders = entryIds.map(() => '?').join(',');

  const symptomLogs = await db.getAllAsync<SymptomRow>(
    `SELECT sl.daily_entry_id, sl.symptom_id, sl.severity, s.display_name as symptom_name
     FROM symptom_logs sl JOIN symptoms s ON s.id = sl.symptom_id
     WHERE sl.daily_entry_id IN (${placeholders}) AND s.is_enabled = 1`,
    entryIds
  );
  const triggerLogs = await db.getAllAsync<TriggerRow>(
    `SELECT tl.daily_entry_id, tl.trigger_id, tl.value, t.display_name as trigger_name
     FROM trigger_logs tl JOIN triggers t ON t.id = tl.trigger_id
     WHERE tl.daily_entry_id IN (${placeholders}) AND t.is_enabled = 1`,
    entryIds
  );
  const cycleLogs = await db.getAllAsync<CycleRow>(
    `SELECT daily_entry_id, phase FROM cycle_logs WHERE daily_entry_id IN (${placeholders})`,
    entryIds
  );

  // Index by entry
  const symptomsByEntry = new Map<number, Map<number, { severity: number; name: string }>>();
  for (const s of symptomLogs) {
    if (!symptomsByEntry.has(s.daily_entry_id)) symptomsByEntry.set(s.daily_entry_id, new Map());
    symptomsByEntry.get(s.daily_entry_id)!.set(s.symptom_id, { severity: s.severity, name: s.symptom_name });
  }
  const triggersByEntry = new Map<number, Map<number, { value: string; name: string }>>();
  for (const t of triggerLogs) {
    if (!triggersByEntry.has(t.daily_entry_id)) triggersByEntry.set(t.daily_entry_id, new Map());
    triggersByEntry.get(t.daily_entry_id)!.set(t.trigger_id, { value: t.value, name: t.trigger_name });
  }
  const phaseByEntry = new Map<number, string>();
  for (const c of cycleLogs) {
    if (c.phase) phaseByEntry.set(c.daily_entry_id, c.phase);
  }

  const symptomIds = Array.from(new Set(symptomLogs.map(s => s.symptom_id)));
  const triggerIds = Array.from(new Set(triggerLogs.map(t => t.trigger_id)));

  const insights: Insight[] = [];

  // 1. Correlations
  for (const sid of symptomIds) {
    const symptomName = symptomLogs.find(s => s.symptom_id === sid)?.symptom_name ?? '';
    for (const tid of triggerIds) {
      const triggerName = triggerLogs.find(t => t.trigger_id === tid)?.trigger_name ?? '';
      const xs: number[] = [];
      const ys: number[] = [];
      let coOccurrences = 0;
      for (const e of entries) {
        const sym = symptomsByEntry.get(e.id)?.get(sid);
        const trg = triggersByEntry.get(e.id)?.get(tid);
        if (sym !== undefined) {
          const triggerPresent = trg?.value === 'true' ? 1 : 0;
          xs.push(triggerPresent);
          ys.push(sym.severity);
          if (triggerPresent === 1) coOccurrences++;
        }
      }
      if (coOccurrences < 7) continue;
      if (xs.length < 7) continue;
      // Need variance in xs for correlation
      const sumX = xs.reduce((a, b) => a + b, 0);
      if (sumX === 0 || sumX === xs.length) continue;
      let r: number;
      try { r = sampleCorrelation(xs, ys); } catch { continue; }
      if (!isFinite(r) || Math.abs(r) <= 0.3) continue;

      const onDays = ys.filter((_, i) => xs[i] === 1);
      const offDays = ys.filter((_, i) => xs[i] === 0);
      const onAvg = onDays.length ? mean(onDays) : 0;
      const offAvg = offDays.length ? mean(offDays) : 0;
      const verb = r > 0 ? 'may worsen' : 'may help';
      insights.push({
        insightType: 'correlation',
        title: `${triggerName} ${verb} your ${symptomName}`,
        description: `On days you logged ${triggerName}, your ${symptomName} averaged ${onAvg.toFixed(1)} vs ${offAvg.toFixed(1)} on days without it. Correlation: r=${r.toFixed(2)} across ${xs.length} days.`,
        severity: r > 0 ? 'warning' : 'positive',
        dataJson: JSON.stringify({ symptomId: sid, triggerId: tid, r, onAvg, offAvg, n: xs.length }),
      });
    }
  }

  // 2. Trend — week-over-week, 4 weeks
  const weeksMs = 7 * 24 * 60 * 60 * 1000;
  const nowMs = today.getTime();
  for (const sid of symptomIds) {
    const symptomName = symptomLogs.find(s => s.symptom_id === sid)?.symptom_name ?? '';
    const weekly: number[][] = [[], [], [], []]; // 0 = most recent
    for (const e of entries) {
      const sym = symptomsByEntry.get(e.id)?.get(sid);
      if (sym === undefined) continue;
      const ageMs = nowMs - dateIntToDate(e.entry_date).getTime();
      const weekIdx = Math.floor(ageMs / weeksMs);
      if (weekIdx >= 0 && weekIdx < 4) weekly[weekIdx].push(sym.severity);
    }
    const avgs = weekly.map(w => w.length > 0 ? mean(w) : null);
    // Walk newest->older. Count consecutive weeks where (newer - older)/older > 0.15
    let consecutiveIncreases = 0;
    for (let i = 0; i < avgs.length - 1; i++) {
      const newer = avgs[i];
      const older = avgs[i + 1];
      if (newer === null || older === null || older === 0) { consecutiveIncreases = 0; continue; }
      if ((newer - older) / older > 0.15) consecutiveIncreases++;
      else consecutiveIncreases = 0;
      if (consecutiveIncreases >= 2) break;
    }
    if (consecutiveIncreases >= 2) {
      insights.push({
        insightType: 'trend',
        title: `${symptomName} has been trending up`,
        description: `Your ${symptomName} has increased more than 15% week-over-week for the last two weeks. Recent weekly averages: ${avgs.map(a => a === null ? '-' : a.toFixed(1)).join(' → ')} (newest first).`,
        severity: 'warning',
        dataJson: JSON.stringify({ symptomId: sid, weeklyAverages: avgs }),
      });
    }
  }

  // 3. Cycle phase
  if (phaseByEntry.size >= 7) {
    for (const sid of symptomIds) {
      const symptomName = symptomLogs.find(s => s.symptom_id === sid)?.symptom_name ?? '';
      const byPhase: Record<string, number[]> = {};
      const all: number[] = [];
      for (const e of entries) {
        const sym = symptomsByEntry.get(e.id)?.get(sid);
        if (sym === undefined) continue;
        all.push(sym.severity);
        const phase = phaseByEntry.get(e.id);
        if (!phase) continue;
        if (!byPhase[phase]) byPhase[phase] = [];
        byPhase[phase].push(sym.severity);
      }
      if (all.length < 7) continue;
      const overallMean = mean(all);
      if (overallMean === 0) continue;
      let topPhase: string | null = null;
      let topAvg = 0;
      for (const [phase, vals] of Object.entries(byPhase)) {
        if (vals.length < 2) continue;
        const avg = mean(vals);
        if (avg > topAvg) { topAvg = avg; topPhase = phase; }
      }
      if (!topPhase) continue;
      if ((topAvg - overallMean) / overallMean > 0.2) {
        insights.push({
          insightType: 'cycle',
          title: `Your ${symptomName} tends to peak during the ${capitalize(topPhase)} phase`,
          description: `During the ${topPhase} phase your ${symptomName} averaged ${topAvg.toFixed(1)}, ${Math.round(((topAvg - overallMean) / overallMean) * 100)}% above your overall average of ${overallMean.toFixed(1)}.`,
          severity: 'info',
          dataJson: JSON.stringify({ symptomId: sid, phase: topPhase, phaseAvg: topAvg, overallMean }),
        });
      }
    }
  }

  // Cache: clear stale (>24h) then insert new
  const cutoff = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  await db.runAsync('DELETE FROM insights_cache WHERE generated_at < ?', [cutoff]);
  await db.runAsync('DELETE FROM insights_cache');
  for (const ins of insights) {
    await db.runAsync(
      'INSERT INTO insights_cache (insight_type, title, description, severity, data_json) VALUES (?, ?, ?, ?, ?)',
      [ins.insightType, ins.title, ins.description, ins.severity, ins.dataJson]
    );
  }

  return insights;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function getCachedInsights(db: SQLite.SQLiteDatabase): Promise<{ insights: Insight[]; generatedAt: number | null }> {
  const rows = await db.getAllAsync<{ insight_type: string; title: string; description: string; severity: string | null; data_json: string | null; generated_at: number }>(
    'SELECT insight_type, title, description, severity, data_json, generated_at FROM insights_cache ORDER BY id ASC'
  );
  if (rows.length === 0) return { insights: [], generatedAt: null };
  return {
    insights: rows.map(r => ({
      insightType: r.insight_type as Insight['insightType'],
      title: r.title,
      description: r.description,
      severity: r.severity as Insight['severity'],
      dataJson: r.data_json,
    })),
    generatedAt: rows[0].generated_at,
  };
}
