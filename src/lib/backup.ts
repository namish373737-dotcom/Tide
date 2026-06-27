import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { getDatabase } from '@/lib/database/client';
import { APP_NAME } from '@/lib/constants';

const USER_DATA_TABLES = [
  'user_settings',
  'conditions',
  'symptoms',
  'triggers',
  'medications',
  'daily_entries',
  'symptom_logs',
  'trigger_logs',
  'medication_logs',
  'cycle_logs',
  'insights_cache',
];

interface BackupPayload {
  appName: string;
  version: 1;
  exportedAt: number;
  tables: Record<string, any[]>;
}

export async function exportBackup(): Promise<string> {
  const db = await getDatabase();
  const tables: Record<string, any[]> = {};
  for (const table of USER_DATA_TABLES) {
    tables[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
  }
  const payload: BackupPayload = {
    appName: APP_NAME,
    version: 1,
    exportedAt: Date.now(),
    tables,
  };
  const json = JSON.stringify(payload, null, 2);
  const fileName = `${APP_NAME.toLowerCase()}-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  const dir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory;
  const fileUri = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: `${APP_NAME} backup` });
  }
  return fileUri;
}

function validatePayload(parsed: any): parsed is BackupPayload {
  if (!parsed || typeof parsed !== 'object') return false;
  if (parsed.version !== 1) return false;
  if (!parsed.tables || typeof parsed.tables !== 'object') return false;
  for (const table of USER_DATA_TABLES) {
    if (!Array.isArray(parsed.tables[table])) return false;
  }
  return true;
}

function quoteIdent(name: string): string {
  // Whitelist: only allow known table names — defense-in-depth, USER_DATA_TABLES is hardcoded
  if (!USER_DATA_TABLES.includes(name)) throw new Error(`Unknown table ${name}`);
  return `"${name}"`;
}

export async function importBackup(): Promise<void> {
  const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (picked.canceled) return;
  const asset = picked.assets?.[0];
  if (!asset) throw new Error('No file selected');
  const text = await FileSystem.readAsStringAsync(asset.uri);
  let parsed: any;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('Backup file is not valid JSON'); }
  if (!validatePayload(parsed)) throw new Error('Backup file structure is invalid');

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const table of [...USER_DATA_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${quoteIdent(table)}`);
    }
    for (const table of USER_DATA_TABLES) {
      const rows = parsed.tables[table];
      if (!rows || rows.length === 0) continue;
      const columns = Object.keys(rows[0]);
      const colList = columns.map(c => `"${c}"`).join(', ');
      const placeholders = columns.map(() => '?').join(', ');
      for (const row of rows) {
        const values = columns.map(c => row[c] ?? null);
        await db.runAsync(`INSERT INTO ${quoteIdent(table)} (${colList}) VALUES (${placeholders})`, values);
      }
    }
  });
}
