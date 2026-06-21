import * as SQLite from 'expo-sqlite';
const DB_NAME = 'tide.db';
let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
  }
  return db;
};

const initializeDatabase = async (database: SQLite.SQLiteDatabase) => {
  await database.execAsync('PRAGMA foreign_keys = ON;');
  await database.execAsync(`CREATE TABLE IF NOT EXISTS daily_logs (id TEXT PRIMARY KEY, date TEXT NOT NULL UNIQUE, cycle_day INTEGER, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await database.execAsync(`CREATE TABLE IF NOT EXISTS log_symptoms (id TEXT PRIMARY KEY, log_id TEXT NOT NULL, symptom_id TEXT NOT NULL, severity INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (log_id) REFERENCES daily_logs(id) ON DELETE CASCADE)`);
  await database.execAsync(`CREATE TABLE IF NOT EXISTS log_triggers (id TEXT PRIMARY KEY, log_id TEXT NOT NULL, trigger_id TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (log_id) REFERENCES daily_logs(id) ON DELETE CASCADE)`);
  await database.execAsync(`CREATE TABLE IF NOT EXISTS medications (id TEXT PRIMARY KEY, name TEXT NOT NULL, dosage TEXT, frequency TEXT NOT NULL, schedule TEXT, start_date TEXT NOT NULL, end_date TEXT, active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await database.execAsync(`CREATE TABLE IF NOT EXISTS log_medications (id TEXT PRIMARY KEY, log_id TEXT NOT NULL, medication_id TEXT, name TEXT NOT NULL, dosage TEXT, taken INTEGER DEFAULT 0, time TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (log_id) REFERENCES daily_logs(id) ON DELETE CASCADE)`);
  await database.execAsync(`CREATE TABLE IF NOT EXISTS insights (id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, confidence REAL NOT NULL, data_points INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await database.execAsync(`CREATE TABLE IF NOT EXISTS conditions (id TEXT PRIMARY KEY, name TEXT NOT NULL, symptom_pack TEXT NOT NULL, trigger_pack TEXT NOT NULL, active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_log_symptoms_log_id ON log_symptoms(log_id)`);
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date)`);
  console.log('Database initialized successfully');
};
