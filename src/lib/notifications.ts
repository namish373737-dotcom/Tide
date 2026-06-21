import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleDailyReminder(time: string = '21:00'): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  const [hours, minutes] = time.split(':').map(Number);
  const trigger: any = {
    type: 'daily',
    hour: hours,
    minute: minutes,
  };
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time for your daily check-in',
      body: 'Track your symptoms in under 60 seconds.',
      sound: 'default',
    },
    trigger,
  });
  
  return id;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getNotificationStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
