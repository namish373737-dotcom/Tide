import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database/client';
import { Symptom, Trigger, Medication, Condition } from '@/types';

export function useSymptoms() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const rows = await db.getAllAsync<Symptom>(
        'SELECT * FROM symptoms WHERE is_enabled = 1 ORDER BY sort_order'
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
        'SELECT * FROM triggers WHERE is_enabled = 1 ORDER BY sort_order'
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
        'SELECT * FROM medications WHERE is_active = 1 ORDER BY created_at DESC'
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
      const rows = await db.getAllAsync<Condition>('SELECT * FROM conditions WHERE is_active = 1');
      setConditions(rows);
      setLoading(false);
    }
    fetch();
  }, []);

  return { conditions, loading };
}
