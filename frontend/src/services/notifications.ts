import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const SESSION_START_ID = 'drivewise-session-start-reminder';
const SESSION_END_ID = 'drivewise-session-end-reminder';

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleSessionStartReminder(hour: number, minute: number): Promise<void> {
  await cancelSessionStartReminder();
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: SESSION_START_ID,
    content: {
      title: 'DriveWise — Début de journée',
      body: "C'est l'heure de démarrer votre session. Pensez à lancer le suivi !",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelSessionStartReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(SESSION_START_ID).catch(() => {});
}

export async function scheduleSessionEndReminder(
  shiftStartedAt: string,
  thresholdHours: number
): Promise<void> {
  await cancelSessionEndReminder();
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const triggerDate = new Date(new Date(shiftStartedAt).getTime() + thresholdHours * 3600 * 1000);
  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: SESSION_END_ID,
    content: {
      title: 'Session toujours active',
      body: `Vous conduisez depuis ${thresholdHours}h. Pensez à terminer votre session.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelSessionEndReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(SESSION_END_ID).catch(() => {});
}

export async function cancelAllReminders(): Promise<void> {
  await Promise.all([cancelSessionStartReminder(), cancelSessionEndReminder()]);
}
