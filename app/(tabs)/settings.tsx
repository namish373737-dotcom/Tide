import { View, Text, Pressable, ScrollView, StyleSheet, Alert, StatusBar } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getDatabase } from '@/lib/database/client';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, Trash2, Bell, Heart, ChevronRight, Fingerprint, Cloud, Lock, Pill, Download, Upload } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, LAYOUT } from '@/lib/theme';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { exportBackup, importBackup } from '@/lib/backup';
import { useNotifications } from '@/hooks/useNotifications';

const REMINDER_PRESETS = [
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '23:00', label: '11:00 PM' },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { reminderTime, reminderEnabled, updateReminder, toggleReminder } = useNotifications();

  useEffect(() => {
    async function fetch() {
      const db = await getDatabase();
      const row = await db.getFirstAsync('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');
      setSettings(row);
      const bio = await LocalAuthentication.hasHardwareAsync();
      setBiometricAvailable(bio);
    }
    fetch();
  }, []);

  const handleDeleteAll = () => {
    Alert.alert('Delete All Data', 'This will permanently delete all your health data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const db = await getDatabase();
          await db.runAsync('DELETE FROM daily_entries');
          await db.runAsync('DELETE FROM symptom_logs');
          await db.runAsync('DELETE FROM trigger_logs');
          await db.runAsync('DELETE FROM medication_logs');
          await db.runAsync('DELETE FROM cycle_logs');
          await db.runAsync('DELETE FROM insights_cache');
          await db.runAsync('UPDATE user_settings SET onboarding_complete = 0, selected_conditions = "[]"');
          await db.runAsync('UPDATE symptoms SET is_enabled = 0');
          await db.runAsync('UPDATE triggers SET is_enabled = 0');
          Alert.alert('Data Deleted', 'All your data has been permanently removed.');
          router.replace('/onboarding/welcome');
        },
      },
    ]);
  };

  const handleResetOnboarding = async () => {
    const db = await getDatabase();
    const latest = await db.getFirstAsync<{ id: number }>('SELECT id FROM user_settings ORDER BY id DESC LIMIT 1');
    if (latest) {
      await db.runAsync('UPDATE user_settings SET onboarding_complete = 0 WHERE id = ?', [latest.id]);
    }
    await db.runAsync('UPDATE symptoms SET is_enabled = 0');
    await db.runAsync('UPDATE triggers SET is_enabled = 0');
    router.replace('/onboarding/welcome');
  };

  const toggleBiometric = async () => {
    const db = await getDatabase();
    const newVal = settings?.biometric_lock_enabled ? 0 : 1;
    await db.runAsync('UPDATE user_settings SET biometric_lock_enabled = ?', [newVal]);
    setSettings({ ...settings, biometric_lock_enabled: newVal });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <SettingRow
            icon={<Bell size={20} color={COLORS.primary} />}
            title="Daily Reminder"
            subtitle={reminderEnabled ? `Reminds you at ${REMINDER_PRESETS.find(p => p.value === reminderTime)?.label || reminderTime}` : 'Get a daily reminder to log your symptoms'}
            onPress={() => toggleReminder(!reminderEnabled)}
            toggle
            value={reminderEnabled}
          />
          {reminderEnabled && (
            <View style={styles.timePresetsRow}>
              {REMINDER_PRESETS.map(preset => (
                <Pressable
                  key={preset.value}
                  onPress={() => updateReminder(preset.value)}
                  style={[styles.timePresetButton, reminderTime === preset.value && styles.timePresetButtonActive]}
                >
                  <Text style={[styles.timePresetText, reminderTime === preset.value && styles.timePresetTextActive]}>{preset.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pill size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Medications</Text>
          </View>
          <SettingRow
            icon={<Pill size={20} color={COLORS.primary} />}
            title="Manage Medications"
            subtitle="Add or remove medications and supplements"
            onPress={() => router.push('/medications')}
          />
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>
          <Text style={styles.sectionDescription}>Your data is stored only on this device. We do not collect, share, or sell your health information.</Text>
          {biometricAvailable && (
            <SettingRow icon={<Fingerprint size={20} color={COLORS.primary} />} title="Biometric Lock" subtitle={settings?.biometric_lock_enabled ? 'Face ID / Touch ID is enabled' : 'Require Face ID or Touch ID to open the app'}
              onPress={toggleBiometric} toggle value={!!settings?.biometric_lock_enabled} />
          )}
        </View>

        {/* Data Backup */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Cloud size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Data</Text>
          </View>
          <SettingRow
            icon={<Download size={20} color={COLORS.primary} />}
            title="Export Backup"
            subtitle="Save a full JSON backup of all your data"
            onPress={async () => {
              try { await exportBackup(); }
              catch (e: any) { Alert.alert('Export Failed', e?.message ?? 'Could not export backup.'); }
            }}
          />
          <SettingRow
            icon={<Upload size={20} color={COLORS.primary} />}
            title="Import Backup"
            subtitle="Restore from a previous backup file"
            onPress={() => {
              Alert.alert(
                'Import Backup?',
                'This will overwrite all data currently on this device. Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Import', style: 'destructive', onPress: async () => {
                      try {
                        await importBackup();
                        Alert.alert('Import Complete', 'Your data has been restored.');
                      } catch (e: any) {
                        Alert.alert('Import Failed', e?.message ?? 'Could not import backup.');
                      }
                    },
                  },
                ]
              );
            }}
          />
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color={COLORS.danger} />
            <Text style={styles.sectionTitle}>Data Management</Text>
          </View>
          <SettingRow icon={<Trash2 size={20} color={COLORS.danger} />} title="Delete All Data" subtitle="Permanently remove all health data from this device" onPress={handleDeleteAll} danger />
          <SettingRow icon={<Lock size={20} color={COLORS.textSecondary} />} title="Reset Onboarding" subtitle="Start over with condition selection" onPress={handleResetOnboarding} />
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.sectionDescription}>{APP_NAME} is built for people living with chronic conditions. We believe your health data belongs to you and no one else.</Text>
          <Text style={styles.versionText}>Version {APP_VERSION}</Text>
        </View>

        {/* Medical Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>Medical Disclaimer:</Text> {APP_NAME} is for informational purposes only and does not provide medical advice. Always consult a qualified healthcare professional.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, title, subtitle, onPress, danger = false, toggle = false, value = false }: {
  icon: React.ReactNode; title: string; subtitle: string; onPress: () => void; danger?: boolean; toggle?: boolean; value?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {toggle ? (
        <View style={[styles.toggle, value && styles.toggleActive]}>
          <View style={[styles.toggleDot, value && styles.toggleDotActive]} />
        </View>
      ) : (
        <ChevronRight size={20} color={COLORS.textTertiary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: LAYOUT.safeTop, paddingBottom: LAYOUT.safeBottom + SPACING.xl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xl },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginLeft: SPACING.sm },
  sectionDescription: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  timePresetsRow: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.sm, paddingBottom: SPACING.sm },
  timePresetButton: { flex: 1, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceElevated, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  timePresetButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timePresetText: { ...TYPOGRAPHY.label, color: COLORS.text },
  timePresetTextActive: { color: COLORS.white },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.divider },
  settingRowPressed: { opacity: 0.7 },
  settingIcon: { marginRight: SPACING.sm },
  settingContent: { flex: 1 },
  settingTitle: { ...TYPOGRAPHY.label, color: COLORS.text },
  settingTitleDanger: { color: COLORS.danger },
  settingSubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: RADIUS.full, backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleDot: { width: 24, height: 24, borderRadius: RADIUS.full, backgroundColor: COLORS.white, ...SHADOWS.sm },
  toggleDotActive: { transform: [{ translateX: 20 }] },
  versionText: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: SPACING.sm },
  disclaimer: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  disclaimerText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 22 },
  disclaimerBold: { ...TYPOGRAPHY.label, color: COLORS.text },
});
