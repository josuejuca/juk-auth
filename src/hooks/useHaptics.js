import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';

export function useHaptics() {
  const { hapticsEnabled } = useSettings();
  return {
    tap: () => hapticsEnabled && Haptics.selectionAsync().catch(() => {}),
    success: () => hapticsEnabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
    error: () => hapticsEnabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
  };
}
