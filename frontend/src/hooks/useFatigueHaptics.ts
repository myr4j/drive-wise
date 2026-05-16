import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { useFatigueStore } from '@/store';
import { FatigueLevel } from '@/types/api';
import { useToast } from '@/components/ui/Toast';

const LEVEL_ORDER: FatigueLevel[] = [
  FatigueLevel.LOW,
  FatigueLevel.MODERATE,
  FatigueLevel.HIGH,
  FatigueLevel.CRITICAL,
];

/**
 * Watches the global fatigue level and triggers haptic feedback the
 * moment it crosses into a higher tier. Pairs the feedback with a
 * non-intrusive Toast so drivers who glance briefly still get context.
 *
 * Mount once near the root (AppShell) — it has no UI.
 */
export function useFatigueHaptics() {
  const level = useFatigueStore((s) => s.currentFatigueLevel);
  const previousLevelRef = useRef<FatigueLevel | null>(null);
  const toast = useToast();

  useEffect(() => {
    const previous = previousLevelRef.current;
    previousLevelRef.current = level;

    if (!level || !previous) return;
    if (level === previous) return;

    const prevIdx = LEVEL_ORDER.indexOf(previous);
    const nextIdx = LEVEL_ORDER.indexOf(level);
    if (prevIdx === -1 || nextIdx === -1) return;

    // Only fire on UPWARD transitions (fatigue rising).
    if (nextIdx <= prevIdx) return;

    switch (level) {
      case FatigueLevel.MODERATE:
        Haptics.selectionAsync().catch(() => {});
        break;
      case FatigueLevel.HIGH:
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        ).catch(() => {});
        toast.warning(
          'Pensez à faire une pause bientôt.',
          'Fatigue élevée'
        );
        break;
      case FatigueLevel.CRITICAL:
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
        // Double-tap for emphasis on critical
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
            () => {}
          );
        }, 150);
        toast.error(
          'Arrêtez-vous dès que possible pour vous reposer.',
          'Fatigue critique'
        );
        break;
      default:
        break;
    }
  }, [level, toast]);
}
