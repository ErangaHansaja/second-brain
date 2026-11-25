import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

async function triggerImpact(style: Haptics.ImpactFeedbackStyle): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Ignore when haptics are unavailable or disabled in device settings
  }
}

async function triggerNotification(
  type: Haptics.NotificationFeedbackType
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // Ignore when haptics are unavailable or disabled in device settings
  }
}

export function hapticLight(): void {
  void triggerImpact(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium(): void {
  void triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticSuccess(): void {
  void triggerNotification(Haptics.NotificationFeedbackType.Success);
}

export function hapticWarning(): void {
  void triggerNotification(Haptics.NotificationFeedbackType.Warning);
}
