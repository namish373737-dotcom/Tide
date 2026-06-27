import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('solace.db');
  await initializeSchema();
  await seedDatabase();
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

async function initializeSchema(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      onboarding_complete INTEGER DEFAULT 0,
      selected_conditions TEXT NOT NULL,
      daily_reminder_time TEXT DEFAULT '21:00',
      reminder_enabled INTEGER DEFAULT 1,
      healthkit_sync_enabled INTEGER DEFAULT 0,
      healthkit_sync_types TEXT,
      icloud_backup_enabled INTEGER DEFAULT 0,
      biometric_lock_enabled INTEGER DEFAULT 0,
      dark_mode_preference TEXT DEFAULT 'system',
      pro_subscription_status TEXT DEFAULT 'inactive',
      pro_subscription_expiry INTEGER,
      last_review_prompt INTEGER DEFAULT 0,
      check_in_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condition_id INTEGER REFERENCES conditions(id),
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      is_enabled INTEGER DEFAULT 0,
      is_custom INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS triggers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      category TEXT,
      input_type TEXT DEFAULT 'boolean',
      is_enabled INTEGER DEFAULT 0,
      is_custom INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      purpose TEXT,
      reminder_time TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS daily_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date INTEGER NOT NULL UNIQUE,
      notes TEXT,
      mood INTEGER,
      energy INTEGER,
      sleep_hours REAL,
      steps INTEGER,
      resting_heart_rate INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS symptom_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_entry_id INTEGER NOT NULL,
      symptom_id INTEGER NOT NULL,
      severity INTEGER NOT NULL,
      notes TEXT,
      UNIQUE(daily_entry_id, symptom_id)
    );

    CREATE TABLE IF NOT EXISTS trigger_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_entry_id INTEGER NOT NULL,
      trigger_id INTEGER NOT NULL,
      value TEXT,
      notes TEXT,
      UNIQUE(daily_entry_id, trigger_id)
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_entry_id INTEGER NOT NULL,
      medication_id INTEGER NOT NULL,
      taken INTEGER DEFAULT 0,
      taken_at INTEGER,
      dose_taken TEXT,
      notes TEXT,
      UNIQUE(daily_entry_id, medication_id)
    );

    CREATE TABLE IF NOT EXISTS cycle_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_entry_id INTEGER NOT NULL,
      flow_level TEXT,
      cycle_day INTEGER,
      phase TEXT,
      ovulation_test INTEGER,
      cervical_mucus TEXT,
      UNIQUE(daily_entry_id)
    );

    CREATE TABLE IF NOT EXISTS insights_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      generated_at INTEGER DEFAULT (unixepoch()),
      insight_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT,
      data_json TEXT,
      is_dismissed INTEGER DEFAULT 0,
      valid_until INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_symptom_logs_entry ON symptom_logs(daily_entry_id);
    CREATE INDEX IF NOT EXISTS idx_symptom_logs_symptom ON symptom_logs(symptom_id);
    CREATE INDEX IF NOT EXISTS idx_trigger_logs_entry ON trigger_logs(daily_entry_id);
    CREATE INDEX IF NOT EXISTS idx_trigger_logs_trigger ON trigger_logs(trigger_id);
    CREATE INDEX IF NOT EXISTS idx_medication_logs_entry ON medication_logs(daily_entry_id);
    CREATE INDEX IF NOT EXISTS idx_medication_logs_medication ON medication_logs(medication_id);
    CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(entry_date);
  `);

  await addColumnIfMissing('user_settings', 'last_review_prompt', 'INTEGER DEFAULT 0');
  await addColumnIfMissing('user_settings', 'check_in_count', 'INTEGER DEFAULT 0');
}

async function addColumnIfMissing(table: string, column: string, definition: string): Promise<void> {
  if (!db) return;
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some(c => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function seedDatabase(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM conditions');
  if (count && count.count > 0) return;

  await db.withTransactionAsync(async () => {
    // Seed conditions
    await db!.runAsync(
      `INSERT INTO conditions (name, display_name, description) VALUES 
      (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [
        'endometriosis', 'Endometriosis', 'A condition where tissue similar to the uterine lining grows outside the uterus, causing pain and inflammation.',
        'pcos', 'PCOS', 'Polycystic ovary syndrome — a hormonal disorder causing irregular periods, excess androgen, and ovarian cysts.',
        'pmdd', 'PMDD', 'Premenstrual dysphoric disorder — severe PMS with emotional and physical symptoms.',
        'fibromyalgia', 'Fibromyalgia', 'Widespread musculoskeletal pain accompanied by fatigue, sleep, memory, and mood issues.',
        'chronic_pain', 'Chronic Pain', 'Persistent pain lasting longer than 3-6 months.',
        'other', 'Other', 'A different chronic condition not listed above.'
      ]
    );

    // Get condition IDs
    const endo = await db!.getFirstAsync<{ id: number }>("SELECT id FROM conditions WHERE name = 'endometriosis'");
    const pcos = await db!.getFirstAsync<{ id: number }>("SELECT id FROM conditions WHERE name = 'pcos'");
    const pmdd = await db!.getFirstAsync<{ id: number }>("SELECT id FROM conditions WHERE name = 'pmdd'");
    const fibro = await db!.getFirstAsync<{ id: number }>("SELECT id FROM conditions WHERE name = 'fibromyalgia'");
    const pain = await db!.getFirstAsync<{ id: number }>("SELECT id FROM conditions WHERE name = 'chronic_pain'");
    const other = await db!.getFirstAsync<{ id: number }>("SELECT id FROM conditions WHERE name = 'other'");

    const conditionIds = {
      endo: endo?.id || 0,
      pcos: pcos?.id || 0,
      pmdd: pmdd?.id || 0,
      fibro: fibro?.id || 0,
      pain: pain?.id || 0,
      other: other?.id || 0,
    };

    // Seed symptoms
    await db!.runAsync(
      `INSERT INTO symptoms (condition_id, name, display_name, category, sort_order) VALUES
      (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [
        // Endometriosis
        conditionIds.endo, 'pelvic_pain', 'Pelvic Pain', 'pain', 1,
        conditionIds.endo, 'period_cramps', 'Period Cramps', 'pain', 2,
        conditionIds.endo, 'pain_during_sex', 'Pain During Sex', 'pain', 3,
        conditionIds.endo, 'bloating', 'Bloating', 'digestive', 4,
        conditionIds.endo, 'nausea', 'Nausea', 'digestive', 5,
        conditionIds.endo, 'fatigue', 'Fatigue', 'energy', 6,
        conditionIds.endo, 'brain_fog', 'Brain Fog', 'cognitive', 7,
        conditionIds.endo, 'lower_back_pain', 'Lower Back Pain', 'pain', 8,
        conditionIds.endo, 'leg_pain', 'Leg Pain', 'pain', 9,
        conditionIds.endo, 'bowel_issues', 'Bowel Issues', 'digestive', 10,
        conditionIds.endo, 'urinary_pain', 'Urinary Pain', 'pain', 11,
        conditionIds.endo, 'mood_changes', 'Mood Changes', 'mood', 12,
        // PCOS
        conditionIds.pcos, 'irregular_periods', 'Irregular Periods', 'reproductive', 1,
        conditionIds.pcos, 'acne', 'Acne', 'skin', 2,
        conditionIds.pcos, 'hair_loss', 'Hair Loss', 'skin', 3,
        conditionIds.pcos, 'excess_hair', 'Excess Hair Growth', 'skin', 4,
        conditionIds.pcos, 'weight_gain', 'Weight Gain', 'metabolic', 5,
        conditionIds.pcos, 'fatigue_pcos', 'Fatigue', 'energy', 6,
        conditionIds.pcos, 'cravings', 'Sugar Cravings', 'diet', 7,
        conditionIds.pcos, 'anxiety', 'Anxiety', 'mood', 8,
        conditionIds.pcos, 'depression', 'Depression', 'mood', 9,
        conditionIds.pcos, 'sleep_issues', 'Sleep Issues', 'sleep', 10,
        conditionIds.pcos, 'ovulation_pain', 'Ovulation Pain', 'pain', 11,
      ]
    );

    // Seed triggers
    await db!.runAsync(
      `INSERT INTO triggers (name, display_name, category, input_type) VALUES
      (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?),
      (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?),
      (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)`,
      [
        'dairy', 'Dairy', 'diet', 'boolean',
        'gluten', 'Gluten', 'diet', 'boolean',
        'sugar', 'High Sugar', 'diet', 'boolean',
        'alcohol', 'Alcohol', 'lifestyle', 'boolean',
        'caffeine', 'Caffeine', 'lifestyle', 'boolean',
        'exercise', 'Exercise', 'lifestyle', 'boolean',
        'stress', 'High Stress', 'stress', 'scale',
        'sleep_quality', 'Good Sleep', 'sleep', 'boolean',
        'nsaids', 'Pain Relievers', 'medication', 'boolean',
        'heating_pad', 'Heat Therapy', 'lifestyle', 'boolean',
        'work', 'Work Day', 'lifestyle', 'boolean',
        'social', 'Social Activity', 'lifestyle', 'boolean',
        'weather_change', 'Weather Change', 'environmental', 'boolean',
      ]
    );
  });
}
