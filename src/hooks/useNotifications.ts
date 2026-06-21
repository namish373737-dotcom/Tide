import { useEffect, useState } from 'react';
import { getDatabase } from '@/lib/database/client';
import { scheduleDailyReminder, requestNotificationPermissions, cancelAllNotifications } from '@/lib/notifications';

export function useNotifications() {
  const [reminderTime, setReminderTime] = useState('21:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    async function load() {
      const db = await getDatabase();
      const settings = await db.getFirstAsync<{ daily_reminder_time: string; reminder_enabled: number }>(
        'SELECT daily_reminder_time, reminder_enabled FROM user_settings LIMIT 1'
      );
      if (settings) {
        setReminderTime(settings.daily_reminder_time || '21:00');
        setReminderEnabled(!!settings.reminder_enabled);
      }
    }
    load();
  }, []);

  const updateReminder = async (time: string) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE user_settings SET daily_reminder_time = ?', [time]);
    setReminderTime(time);
    if (reminderEnabled) {
      const granted = await requestNotificationPermissions();
      setPermissionGranted(granted);
      if (granted) await scheduleDailyReminder(time);
    }
  };

  const toggleReminder = async (enabled: boolean) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE user_settings SET reminder_enabled = ?', [enabled ? 1 : 0]);
    setReminderEnabled(enabled);
    if (enabled) {
      const granted = await requestNotificationPermissions();
      setPermissionGranted(granted);
      if (granted) await scheduleDailyReminder(reminderTime);
    } else {
      await cancelAllNotifications();
    }
  };

  return { reminderTime, reminderEnabled, permissionGranted, updateReminder, toggleReminder };
}
