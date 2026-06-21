import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DailyLog, Medication, Condition, UserSettings, Insight, SYMPTOM_PACKS, COMMON_TRIGGERS } from '@/types';
import { getDatabase } from '@/utils/database';

interface AppContextType {
  currentCondition: Condition | null;
  conditions: Condition[];
  setCondition: (conditionId: string) => Promise<void>;
  logs: DailyLog[];
  addLog: (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLog: (id: string, updates: Partial<DailyLog>) => Promise<void>;
  getLogByDate: (date: string) => Promise<DailyLog | null>;
  medications: Medication[];
  addMedication: (medication: Omit<Medication, 'id' | 'active' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMedication: (id: string, updates: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  insights: Insight[];
  refreshInsights: () => Promise<void>;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [currentCondition, setCurrentCondition] = useState<Condition | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    conditions: [],
    reminders: [],
    dataRetentionDays: 365,
    exportFormat: 'pdf',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await getDatabase();
      await loadConditions();
      await loadLogs();
      await loadMedications();
      await loadInsights();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConditions = async () => {
    const db = await getDatabase();
    const result = await db.getAllAsync<Condition>('SELECT * FROM conditions ORDER BY created_at DESC');
    
    if (result.length === 0) {
      // Initialize with default conditions
      const defaultConditions: Condition[] = [
        { id: 'endo', name: 'Endometriosis', symptomPack: JSON.stringify(SYMPTOM_PACKS.endometriosis), triggerPack: JSON.stringify(COMMON_TRIGGERS.filter(t => ['diet', 'stress', 'sleep'].includes(t.category))), active: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'pcos', name: 'PCOS', symptomPack: JSON.stringify(SYMPTOM_PACKS.pcos), triggerPack: JSON.stringify(COMMON_TRIGGERS.filter(t => ['diet', 'stress', 'exercise'].includes(t.category))), active: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'fibro', name: 'Fibromyalgia', symptomPack: JSON.stringify(SYMPTOM_PACKS.fibromyalgia), triggerPack: JSON.stringify(COMMON_TRIGGERS.filter(t => ['stress', 'sleep', 'exercise', 'environment'].includes(t.category))), active: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'autoimmune', name: 'Autoimmune', symptomPack: JSON.stringify(SYMPTOM_PACKS.autoimmune), triggerPack: JSON.stringify(COMMON_TRIGGERS), active: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
      
      for (const cond of defaultConditions) {
        await db.runAsync('INSERT INTO conditions (id, name, symptom_pack, trigger_pack, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cond.id, cond.name, cond.symptomPack, cond.triggerPack, cond.active, cond.createdAt, cond.updatedAt]);
      }
      
      setConditions(defaultConditions);
      setCurrentCondition(defaultConditions[0]);
    } else {
      setConditions(result);
      setCurrentCondition(result.find(c => c.active === 1) || result[0]);
    }
  };

  const setCondition = async (conditionId: string) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE conditions SET active = 0');
    await db.runAsync('UPDATE conditions SET active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conditionId]);
    
    const condition = conditions.find(c => c.id === conditionId);
    if (condition) {
      setCurrentCondition(condition);
    }
  };

  const loadLogs = async () => {
    const db = await getDatabase();
    const result = await db.getAllAsync<DailyLog>('SELECT * FROM daily_logs ORDER BY date DESC');
    setLogs(result);
  };

  const addLog = async (logData: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => {
    const db = await getDatabase();
    const id = `log_${Date.now()}`;
    const now = new Date().toISOString();
    
    await db.runAsync(
      'INSERT INTO daily_logs (id, date, cycle_day, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, logData.date, logData.cycleDay, logData.notes, now, now]
    );

    for (const symptom of logData.symptoms) {
      await db.runAsync(
        'INSERT INTO log_symptoms (id, log_id, symptom_id, severity, created_at) VALUES (?, ?, ?, ?, ?)',
        [`ls_${Date.now()}_${Math.random()}`, id, symptom.symptomId, symptom.severity, now]
      );
    }

    for (const triggerId of logData.triggers) {
      await db.runAsync(
        'INSERT INTO log_triggers (id, log_id, trigger_id, created_at) VALUES (?, ?, ?, ?)',
        [`lt_${Date.now()}_${Math.random()}`, id, triggerId, now]
      );
    }

    for (const med of logData.medications) {
      await db.runAsync(
        'INSERT INTO log_medications (id, log_id, medication_id, name, dosage, taken, time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [`lm_${Date.now()}_${Math.random()}`, id, med.medicationId, med.name, med.dosage, med.taken ? 1 : 0, med.time, now]
      );
    }

    await loadLogs();
    await refreshInsights();
  };

  const updateLog = async (id: string, updates: Partial<DailyLog>) => {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.cycleDay !== undefined) {
      fields.push('cycle_day = ?');
      values.push(updates.cycleDay);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    
    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);
      
      await db.runAsync(`UPDATE daily_logs SET ${fields.join(', ')} WHERE id = ?`, values);
      await loadLogs();
    }
  };

  const getLogByDate = async (date: string): Promise<DailyLog | null> => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<DailyLog>('SELECT * FROM daily_logs WHERE date = ?', [date]);
    return result || null;
  };

  const loadMedications = async () => {
    const db = await getDatabase();
    const result = await db.getAllAsync<Medication>('SELECT * FROM medications WHERE active = 1 ORDER BY name');
    setMedications(result);
  };

  const addMedication = async (medicationData: Omit<Medication, 'id' | 'active' | 'createdAt' | 'updatedAt'>) => {
    const db = await getDatabase();
    const id = `med_${Date.now()}`;
    const now = new Date().toISOString();
    
    await db.runAsync(
      'INSERT INTO medications (id, name, dosage, frequency, schedule, start_date, end_date, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
      [id, medicationData.name, medicationData.dosage, medicationData.frequency, medicationData.schedule ? JSON.stringify(medicationData.schedule) : null, medicationData.startDate, medicationData.endDate, now, now]
    );
    
    await loadMedications();
  };

  const updateMedication = async (id: string, updates: Partial<Medication>) => {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.dosage !== undefined) {
      fields.push('dosage = ?');
      values.push(updates.dosage);
    }
    if (updates.frequency !== undefined) {
      fields.push('frequency = ?');
      values.push(updates.frequency);
    }
    if (updates.schedule !== undefined) {
      fields.push('schedule = ?');
      values.push(JSON.stringify(updates.schedule));
    }
    if (updates.active !== undefined) {
      fields.push('active = ?');
      values.push(updates.active ? 1 : 0);
    }
    
    values.push(id);
    await db.runAsync(`UPDATE medications SET ${fields.join(', ')} WHERE id = ?`, values);
    await loadMedications();
  };

  const deleteMedication = async (id: string) => {
    await updateMedication(id, { active: false });
  };

  const loadInsights = async () => {
    const db = await getDatabase();
    const result = await db.getAllAsync<Insight>('SELECT * FROM insights ORDER BY created_at DESC LIMIT 10');
    setInsights(result);
  };

  const refreshInsights = async () => {
    const db = await getDatabase();
    
    // Simple correlation analysis
    const symptomTriggerData = await db.getAllAsync<any>(`
      SELECT ls.symptom_id, ls.severity, lt.trigger_id, dl.date
      FROM log_symptoms ls
      JOIN daily_logs dl ON ls.log_id = dl.id
      JOIN log_triggers lt ON dl.id = lt.log_id
      ORDER BY dl.date DESC
      LIMIT 100
    `);

    const correlations: Record<string, { count: number; totalSeverity: number }> = {};
    
    symptomTriggerData.forEach(row => {
      const key = `${row.trigger_id}-${row.symptom_id}`;
      if (!correlations[key]) {
        correlations[key] = { count: 0, totalSeverity: 0 };
      }
      correlations[key].count++;
      correlations[key].totalSeverity += row.severity;
    });

    // Clear old insights
    await db.runAsync('DELETE FROM insights');
    
    const newInsights: Insight[] = [];
    const now = new Date().toISOString();
    
    Object.entries(correlations).forEach(([key, data], index) => {
      if (data.count >= 3) {
        const avgSeverity = data.totalSeverity / data.count;
        if (avgSeverity >= 3) {
          const [triggerId, symptomId] = key.split('-');
          const trigger = COMMON_TRIGGERS.find(t => t.id === triggerId);
          
          const insight: Insight = {
            id: `insight_${index}`,
            type: 'correlation',
            title: `${trigger?.name || triggerId} & Symptoms`,
            description: `On days with ${trigger?.name || triggerId}, average symptom severity is ${avgSeverity.toFixed(1)}/5`,
            confidence: Math.min(0.9, data.count / 10),
            dataPoints: data.count,
            createdAt: now,
          };
          
          newInsights.push(insight);
          
          db.runAsync(
            'INSERT INTO insights (id, type, title, description, confidence, data_points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [insight.id, insight.type, insight.title, insight.description, insight.confidence, insight.dataPoints, insight.createdAt]
          );
        }
      }
    });
    
    setInsights(newInsights);
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <AppContext.Provider value={{
      currentCondition,
      conditions,
      setCondition,
      logs,
      addLog,
      updateLog,
      getLogByDate,
      medications,
      addMedication,
      updateMedication,
      deleteMedication,
      insights,
      refreshInsights,
      settings,
      updateSettings,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
