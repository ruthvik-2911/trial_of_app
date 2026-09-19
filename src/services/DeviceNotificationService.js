import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * DeviceNotificationService
 * Handles native mobile notifications and Firebase FCM Push Notifications
 * using expo-notifications.
 */

let Notifications = null;
try {
    Notifications = require('expo-notifications');

    // Configure foreground notification handling
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
} catch (_) {
    console.warn(
        '[DeviceNotificationService] expo-notifications is not available.'
    );
}

const isAvailable = () => Notifications !== null;

const DeviceNotificationService = {
    /**
     * Request notification permissions from the user.
     * @returns {Promise<boolean>} True if granted, false otherwise.
     */
    requestPermissions: async () => {
        if (!isAvailable()) return false;
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('[DeviceNotificationService] Permission not granted.');
                return false;
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    sound: 'default',
                    enableVibrate: true,
                    showBadge: true,
                });
            }

            return true;
        } catch (error) {
            console.error('[DeviceNotificationService] requestPermissions error:', error);
            return false;
        }
    },

    /**
     * Register device for FCM Push Notifications.
     * Requests permissions, sets up Android channel, obtains FCM & Expo push tokens,
     * and saves them to AsyncStorage.
     * @returns {Promise<{ fcmToken: string|null, expoPushToken: string|null }>}
     */
    registerForPushNotificationsAsync: async () => {
        if (!isAvailable()) {
            return { fcmToken: null, expoPushToken: null };
        }

        const hasPermission = await DeviceNotificationService.requestPermissions();
        if (!hasPermission) {
            return { fcmToken: null, expoPushToken: null };
        }

        let fcmToken = null;
        let expoPushToken = null;

        try {
            // Get raw FCM Device Push Token (from Firebase Cloud Messaging)
            try {
                const deviceTokenObj = await Notifications.getDevicePushTokenAsync();
                fcmToken = deviceTokenObj?.data || null;
                if (fcmToken) {
                    console.log('🔥 [FCM Push Token]:', fcmToken);
                    await AsyncStorage.setItem('@fcm_token', fcmToken);
                }
            } catch (fcmErr) {
                console.warn('[DeviceNotificationService] Could not fetch raw FCM token:', fcmErr?.message);
            }

            // Get Expo Push Token as fallback/secondary
            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
                const expoTokenObj = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
                expoPushToken = expoTokenObj?.data || null;
                if (expoPushToken) {
                    console.log('📲 [Expo Push Token]:', expoPushToken);
                    await AsyncStorage.setItem('@push_token', expoPushToken);
                }
            } catch (expoPushErr) {
                console.warn('[DeviceNotificationService] Could not fetch Expo push token:', expoPushErr?.message);
            }

            return { fcmToken, expoPushToken };
        } catch (error) {
            console.error('[DeviceNotificationService] registerForPushNotificationsAsync error:', error);
            return { fcmToken: null, expoPushToken: null };
        }
    },

    /**
     * Get locally stored FCM token.
     */
    getSavedFcmToken: async () => {
        try {
            return await AsyncStorage.getItem('@fcm_token');
        } catch (_) {
            return null;
        }
    },

    /**
     * Add listener for incoming notifications while app is in foreground.
     */
    addNotificationReceivedListener: (callback) => {
        if (!isAvailable() || typeof callback !== 'function') return { remove: () => {} };
        return Notifications.addNotificationReceivedListener(callback);
    },

    /**
     * Add listener for user interaction with a notification (tap/click).
     */
    addNotificationResponseReceivedListener: (callback) => {
        if (!isAvailable() || typeof callback !== 'function') return { remove: () => {} };
        return Notifications.addNotificationResponseReceivedListener(callback);
    },

    /**
     * Schedule a local notification.
     */
    showAlert: async ({ title, body, data = {}, seconds = 1 }) => {
        if (!isAvailable()) return;
        try {
            const hasPermission = await DeviceNotificationService.requestPermissions();
            if (!hasPermission) return;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: 'default',
                    ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
                },
                trigger: { seconds },
            });
        } catch (error) {
            console.error('[DeviceNotificationService] showAlert error:', error);
        }
    },

    /**
     * Cancel all scheduled notifications.
     */
    cancelAll: async () => {
        if (!isAvailable()) return;
        await Notifications.cancelAllScheduledNotificationsAsync();
    },
};

export default DeviceNotificationService;