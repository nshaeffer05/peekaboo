import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PermissionState = 'granted' | 'undetermined' | 'blocked';

export const permissionState = async (): Promise<PermissionState> => {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'blocked';
};

const projectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

/** Asks once and registers this device's Expo push token with the server. */
export const enablePush = async (): Promise<PermissionState> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('snaps', {
      name: 'New photos',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }
  let state = await permissionState();
  if (state === 'undetermined') {
    const asked = await Notifications.requestPermissionsAsync();
    state = asked.granted ? 'granted' : asked.canAskAgain ? 'undetermined' : 'blocked';
  }
  if (state !== 'granted' || !Device.isDevice) return state;
  const id = projectId();
  if (!id) return state;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    if (token) await api.registerPushToken(token, Platform.OS);
  } catch (e) {
    console.warn('push registration failed', e);
  }
  return state;
};

export const disablePush = async () => {
  const id = projectId();
  if (!id || !Device.isDevice) return;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    if (token) await api.forgetPushToken(token);
  } catch {
    /* nothing to forget */
  }
};
