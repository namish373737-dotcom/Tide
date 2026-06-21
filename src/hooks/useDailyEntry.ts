import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/database/client';
import { DailyEntry, SymptomLog, TriggerLog, MedicationLog, CycleLog } from '@/types';

export function useDailyEntry(date: number) {
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [triggerLogs, setTriggerLogs] = useState<TriggerLog[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [cycleLog, setCycleLog] = useState<CycleLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntry = useCallback(async () => {
    setLoading(true);
    const db = await getDatabase();
    
    const entryRow = await db.getFirstAsync<DailyEntry>(
      'SELECT * FROM daily_entries WHERE entry_date = ?',
      [date]
    );

    if (entryRow) {
      setEntry(entryRow);
      
      const sLogs = await db.getAllAsync<SymptomLog>(
        'SELECT * FROM symptom_logs WHERE daily_entry_id = ?',
        [entryRow.id]
      );
      setSymptomLogs(sLogs);

      const tLogs = await db.getAllAsync<TriggerLog>(
        'SELECT * FROM trigger_logs WHERE daily_entry_id = ?',
        [entryRow.id]
      );
      setTriggerLogs(tLogs);

      const mLogs = await db.getAllAsync<MedicationLog>(
        'SELECT * FROM medication_logs WHERE daily_entry_id = ?',
        [entryRow.id]
      );
      setMedicationLogs(mLogs);

      const cLog = await db.getFirstAsync<CycleLog>(
        'SELECT * FROM cycle_logs WHERE daily_entry_id = ?',
        [entryRow.id]
      );
      setCycleLog(cLog || null);
    } else {
      setEntry(null);
      setSymptomLogs([]);
      setTriggerLogs([]);
      setMedicationLogs([]);
      setCycleLog(null);
    }
    
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const saveEntry = useCallback(async (data: {
    notes?: string;
    mood?: number;
    energy?: number;
    sleepHours?: number;
    steps?: number;
    restingHeartRate?: number;
  }) => {
    const db = await getDatabase();
    
    let entryId: number;
    
    if (entry) {
      await db.runAsync(
        `UPDATE daily_entries SET notes = ?, mood = ?, energy = ?, sleep_hours = ?, steps = ?, resting_heart_rate = ?, updated_at = unixepoch() WHERE id = ?`,
        [data.notes || null, data.mood || null, data.energy || null, data.sleepHours || null, data.steps || null, data.restingHeartRate || null, entry.id]
      );
      entryId = entry.id;
    } else {
      const result = await db.runAsync(
        `INSERT INTO daily_entries (entry_date, notes, mood, energy, sleep_hours, steps, resting_heart_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [date, data.notes || null, data.mood || null, data.energy || null, data.sleepHours || null, data.steps || null, data.restingHeartRate || null]
      );
      entryId = result.lastInsertRowId;
    }
    
    await fetchEntry();
    return entryId;
  }, [entry, date, fetchEntry]);

  const saveSymptomLog = useCallback(async (symptomId: number, severity: number) => {
    const db = await getDatabase();
    let entryId = entry?.id;
    
    if (!entryId) {
      const result = await db.runAsync(
        'INSERT INTO daily_entries (entry_date) VALUES (?)',
        [date]
      );
      entryId = result.lastInsertRowId;
    }
    
    await db.runAsync(
      `INSERT OR REPLACE INTO symptom_logs (daily_entry_id, symptom_id, severity) VALUES (?, ?, ?)`,
      [entryId, symptomId, severity]
    );
    
    await fetchEntry();
  }, [entry, date, fetchEntry]);

  const saveTriggerLog = useCallback(async (triggerId: number, value: string) => {
    const db = await getDatabase();
    let entryId = entry?.id;
    
    if (!entryId) {
      const result = await db.runAsync(
        'INSERT INTO daily_entries (entry_date) VALUES (?)',
        [date]
      );
      entryId = result.lastInsertRowId;
    }
    
    await db.runAsync(
      `INSERT OR REPLACE INTO trigger_logs (daily_entry_id, trigger_id, value) VALUES (?, ?, ?)`,
      [entryId, triggerId, value]
    );
    
    await fetchEntry();
  }, [entry, date, fetchEntry]);

  return {
    entry,
    symptomLogs,
    triggerLogs,
    medicationLogs,
    cycleLog,
    loading,
    saveEntry,
    saveSymptomLog,
    saveTriggerLog,
    refresh: fetchEntry,
  };
}
