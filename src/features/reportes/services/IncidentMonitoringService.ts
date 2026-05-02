import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { ApiReporteRepository } from './ApiReporteRepository';

const LOCATION_TASK_NAME = 'incident-location-monitor';
const INCIDENT_NOTIFICATION_CATEGORY_ID = 'incident-verification';
const VERIFY_YES_ACTION_ID = 'verify-yes';
const VERIFY_NO_ACTION_ID = 'verify-no';
const RECENT_NOTIFICATIONS_KEY = 'incident-recent-notifications';
const INCIDENT_RADIUS_METERS = 50;
const RECENT_NOTIFICATION_WINDOW_MS = 1000 * 60 * 60 * 6;

type RecentNotifications = Record<string, number>;
type IncidentCheckReason =
  | 'notification_scheduled'
  | 'outside_radius'
  | 'recently_notified'
  | 'missing_coordinates'
  | 'no_incidents'
  | 'no_location'
  | 'check_completed';

export type IncidentCheckResult = {
  triggered: boolean;
  checkedCount: number;
  nearestPostId?: string;
  nearestDistance?: number;
  reason: IncidentCheckReason;
  location?: { latitude: number; longitude: number };
  radiusMeters: number;
  cooldownMs: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getRecentNotifications() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_NOTIFICATIONS_KEY);
    return raw ? (JSON.parse(raw) as RecentNotifications) : {};
  } catch {
    return {};
  }
}

async function setRecentNotifications(value: RecentNotifications) {
  try {
    await AsyncStorage.setItem(RECENT_NOTIFICATIONS_KEY, JSON.stringify(value));
  } catch {}
}

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

async function scheduleIncidentNotification(postId: string, endereco?: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Incidente próximo',
      body: endereco
        ? `Você está perto de ${endereco}. Ainda está acontecendo?`
        : 'Você está perto de um incidente ativo. Ainda está acontecendo?',
      data: { postId },
      categoryIdentifier: INCIDENT_NOTIFICATION_CATEGORY_ID,
    },
    trigger: null,
  });
}

async function runIncidentCheck(
  latestLocation: { latitude: number; longitude: number } | null,
): Promise<IncidentCheckResult> {
  if (!latestLocation) {
    return {
      triggered: false,
      checkedCount: 0,
      reason: 'no_location',
      radiusMeters: INCIDENT_RADIUS_METERS,
      cooldownMs: RECENT_NOTIFICATION_WINDOW_MS,
    };
  }

  const reporteRepository = new ApiReporteRepository();
  const incidents = await reporteRepository.carregarIncidentesAtivosParaNotificacao();
  const recentNotifications = await getRecentNotifications();
  const now = Date.now();

  if (incidents.length === 0) {
    return {
      triggered: false,
      checkedCount: 0,
      reason: 'no_incidents',
      location: latestLocation,
      radiusMeters: INCIDENT_RADIUS_METERS,
      cooldownMs: RECENT_NOTIFICATION_WINDOW_MS,
    };
  }

  let nearestPostId: string | undefined;
  let nearestDistance: number | undefined;
  let lastReason: IncidentCheckReason = 'check_completed';

  for (const incident of incidents) {
    if (
      !incident.postId ||
      incident.latitude == null ||
      incident.longitude == null
    ) {
      lastReason = 'missing_coordinates';
      continue;
    }

    const distance = calculateDistanceMeters(
      latestLocation.latitude,
      latestLocation.longitude,
      incident.latitude,
      incident.longitude,
    );

    if (nearestDistance == null || distance < nearestDistance) {
      nearestDistance = distance;
      nearestPostId = incident.postId;
    }

    const recentAt = recentNotifications[incident.postId];

    if (recentAt && now - recentAt < RECENT_NOTIFICATION_WINDOW_MS) {
      lastReason = 'recently_notified';
      continue;
    }

    if (distance > INCIDENT_RADIUS_METERS) {
      lastReason = 'outside_radius';
      continue;
    }

    await scheduleIncidentNotification(incident.postId, incident.endereco);
    recentNotifications[incident.postId] = now;
    await setRecentNotifications(recentNotifications);

    return {
      triggered: true,
      checkedCount: incidents.length,
      nearestPostId: incident.postId,
      nearestDistance: distance,
      reason: 'notification_scheduled',
      location: latestLocation,
      radiusMeters: INCIDENT_RADIUS_METERS,
      cooldownMs: RECENT_NOTIFICATION_WINDOW_MS,
    };
  }

  await setRecentNotifications(recentNotifications);

  return {
    triggered: false,
    checkedCount: incidents.length,
    nearestPostId,
    nearestDistance,
    reason: lastReason,
    location: latestLocation,
    radiusMeters: INCIDENT_RADIUS_METERS,
    cooldownMs: RECENT_NOTIFICATION_WINDOW_MS,
  };
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error || !data) {
    return;
  }

  const latestLocation = (data as any).locations?.[0]?.coords;
  if (!latestLocation) {
    return;
  }

  try {
    await runIncidentCheck({
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
    });
  } catch (taskError) {
    console.error('[IncidentMonitoring] background task error', taskError);
  }
});

export async function initializeIncidentMonitoring() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  await Notifications.setNotificationCategoryAsync(INCIDENT_NOTIFICATION_CATEGORY_ID, [
    {
      identifier: VERIFY_YES_ACTION_ID,
      buttonTitle: 'Sim, ainda está',
    },
    {
      identifier: VERIFY_NO_ACTION_ID,
      buttonTitle: 'Não, resolvido',
      options: {
        isDestructive: true,
      },
    },
  ]);

  await Notifications.setNotificationChannelAsync('incidents', {
    name: 'Incidentes próximos',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function startIncidentMonitoring() {
  if (isExpoGo()) {
    console.log('[IncidentMonitoring] Expo Go detected. Background location disabled.');
    return false;
  }

  const notificationPermission = await Notifications.getPermissionsAsync();
  if (!notificationPermission.granted) {
    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted) {
      return false;
    }
  }

  const foregroundPermission = await Location.getForegroundPermissionsAsync();
  if (foregroundPermission.status !== 'granted') {
    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.status !== 'granted') {
      return false;
    }
  }

  try {
    const backgroundPermission = await Location.getBackgroundPermissionsAsync();
    if (backgroundPermission.status !== 'granted') {
      const requested = await Location.requestBackgroundPermissionsAsync();
      if (requested.status !== 'granted') {
        return false;
      }
    }
  } catch (error: any) {
    if (
      typeof error?.message === 'string' &&
      error.message.includes('NSLocation')
    ) {
      console.log('[IncidentMonitoring] Native location permissions missing. Rebuild app to enable background monitoring.');
      return false;
    }
    throw error;
  }

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (alreadyStarted) {
    return true;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 25,
    timeInterval: 60000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'Monitorando incidentes próximos',
      notificationBody: 'Você receberá avisos ao se aproximar de um reporte ativo.',
    },
  });

  return true;
}

export async function stopIncidentMonitoring() {
  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

export function subscribeToIncidentNotificationResponses() {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const actionId = response.actionIdentifier;
    if (
      actionId !== VERIFY_YES_ACTION_ID &&
      actionId !== VERIFY_NO_ACTION_ID
    ) {
      return;
    }

    const postId = String(response.notification.request.content.data?.postId || '');
    if (!postId) {
      return;
    }

    const reporteRepository = new ApiReporteRepository();
    await reporteRepository.verifyPost(postId, actionId === VERIFY_YES_ACTION_ID);
  });
}
