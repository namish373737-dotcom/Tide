import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database/client';
import { Symptom, Trigger, Medication, Condition } from '@/types';

const SYMPTOM_COLUMNS = `
  id, 
  condition_id as conditionId, 
  name, 
  display_name as displayName, 
  description, 
  category, 
  is_enabled as isEnabled, 
  is_custom as isCustom, 
  sort_order as sortOrder, 
  created_at as createdAt
`;

const TRIGGER_COLUMNS = `
  id, 
  name, 
  display_name as displayName, 
  category, 
  input_type as inputType, 
  is_enabled as isEnabled, 
  is_custom as isCustom, 
  sort_order as sortOrder, 
  created_at as createdAt
`;

const MEDICATION_COLUMNS = `
  id, 
  name, 
  dosage, 
  frequency, 
  purpose, 
  reminder_time as reminderTime, 
  is_active as isActive, 
  created_at as createdAt
`;

const CONDITION_COLUMNS = `
  id, 
  name, 
  display_name as displayName, 
  description, 
  is_active as isActive
`;

export function useSymptoms() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const rows = await db.getAllAsync<Symptom>(
        `SELECT ${SYMPTOM_COLUMNS} FROM symptoms WHERE is_enabled = 1 ORDER BY sort_order`
      );
      setSymptoms(rows);
      setLoading(false);
    }
    fetch();
  }, []);

  const toggleSymptom = async (id: number, enabled: boolean) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE symptoms SET is_enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
    setSymptoms(prev => prev.map(s => s.id === id ? { ...s, isEnabled: enabled } : s));
  };

  return { symptoms, loading, toggleSymptom };
}

export function useTriggers() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const rows = await db.getAllAsync<Trigger>(
        `SELECT ${TRIGGER_COLUMNS} FROM triggers WHERE is_enabled = 1 ORDER BY sort_order`
      );
      setTriggers(rows);
      setLoading(false);
    }
    fetch();
  }, []);

  const toggleTrigger = async (id: number, enabled: boolean) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE triggers SET is_enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
    setTriggers(prev => prev.map(t => t.id === id ? { ...t, isEnabled: enabled } : t));
  };

  return { triggers, loading, toggleTrigger };
}

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const rows = await db.getAllAsync<Medication>(
        `SELECT ${MEDICATION_COLUMNS} FROM medications WHERE is_active = 1 ORDER BY created_at DESC`
      );
      setMedications(rows);
      setLoading(false);
    }
    fetch();
  }, []);

  return { medications, loading };
}

export function useConditions() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const rows = await db.getAllAsync<Condition>(
        `SELECT ${CONDITION_COLUMNS} FROM conditions WHERE is_active = 1`
      );
      setConditions(rows);
      setLoading(false);
    }
    fetch();
  }, []);

  return { conditions, loading };
}
