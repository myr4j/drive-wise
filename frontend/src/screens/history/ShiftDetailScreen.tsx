import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FadeSlideIn from '@/components/ui/FadeSlideIn';
import { ChevronLeft } from 'lucide-react-native';

import { shiftsApi } from '@/services';
import Screen from '@/components/layout/Screen';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { SkeletonStack } from '@/components/ui/Skeleton';
import FatigueHistoryChart from '@/components/fatigue/FatigueHistoryChart';
import { useTheme } from '@/contexts/ThemeContext';
import {
  formatDateTime,
  formatDuration,
  getFatigueColor,
  getFatigueLabel,
} from '@/utils/formatters';
import {
  ShiftListItem,
  FatigueHistoryPoint,
  FatigueLevel,
} from '@/types/api';

type RootStackParamList = {
  ShiftDetail: { shiftId: string };
};
type ShiftDetailRouteProp = RouteProp<RootStackParamList, 'ShiftDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ShiftDetailScreen() {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const route = useRoute<ShiftDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { shiftId } = route.params;

  const [shift, setShift] = useState<ShiftListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fatigueHistory, setFatigueHistory] = useState<FatigueHistoryPoint[]>(
    []
  );

  const loadShiftDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await shiftsApi.listShifts({ page: 1, per_page: 100 });
      const foundShift = response.shifts.find(
        (s) => String(s.id) === shiftId
      );
      if (!foundShift) {
        setError('Trajet introuvable');
        return;
      }
      setShift(foundShift);

      // Synthesize a fatigue history from the shift duration (backend has
      // no dedicated history endpoint yet).
      const history: FatigueHistoryPoint[] = [];
      const baseTime = new Date(foundShift.started_at).getTime();
      const durationMs = (foundShift.duration_h || 1) * 60 * 60 * 1000;
      const intervals = Math.min(
        20,
        Math.max(5, Math.floor(foundShift.duration_h || 1))
      );
      for (let i = 0; i < intervals; i++) {
        const timestamp = new Date(
          baseTime + (durationMs / intervals) * i
        ).toISOString();
        const progress = i / intervals;
        const score = Math.min(0.2 + progress * 0.6, 0.95);
        const level: FatigueLevel =
          score < 0.3
            ? FatigueLevel.LOW
            : score < 0.6
            ? FatigueLevel.MODERATE
            : score < 0.8
            ? FatigueLevel.HIGH
            : FatigueLevel.CRITICAL;
        history.push({ timestamp, fatigueScore: score, fatigueLevel: level });
      }
      setFatigueHistory(history);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setIsLoading(false);
    }
  }, [shiftId]);

  useEffect(() => {
    loadShiftDetail();
  }, [loadShiftDetail]);

  // ---- Loading state -------------------------------------------------
  if (isLoading) {
    return (
      <Screen
        edges={{ top: true, bottom: true }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <BackLink onPress={() => navigation.goBack()} />
        <SkeletonStack rows={4} rowHeight={80} gap={spacing.md} />
      </Screen>
    );
  }

  // ---- Error state ---------------------------------------------------
  if (error || !shift) {
    return (
      <Screen
        edges={{ top: true, bottom: true }}
        contentContainerStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontSize: 28,
            color: colors.ink,
            marginBottom: spacing.sm,
          }}
        >
          Introuvable
        </Text>
        <Text
          style={{
            ...typeScale.bodyMd,
            color: colors.inkMuted,
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}
        >
          {error || 'Ce trajet n\'existe plus.'}
        </Text>
        <Button variant="primary" size="md" onPress={() => navigation.goBack()}>
          Retour
        </Button>
      </Screen>
    );
  }

  const score = shift.avg_fatigue_score ?? 0;
  const fatigueLevel: FatigueLevel =
    score < 0.3
      ? FatigueLevel.LOW
      : score < 0.6
      ? FatigueLevel.MODERATE
      : score < 0.8
      ? FatigueLevel.HIGH
      : FatigueLevel.CRITICAL;
  const fatigueColor = getFatigueColor(fatigueLevel);
  const isCompleted = shift.status === 'completed';

  return (
    <Screen
      scrollable
      edges={{ top: true, bottom: true }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.xl,
      }}
    >
      <BackLink onPress={() => navigation.goBack()} />

      {/* Header */}
      <FadeSlideIn duration={360}>
        <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>
          Trajet
        </Text>
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontSize: 32,
            lineHeight: 40,
            color: colors.ink,
            marginTop: 4,
            letterSpacing: -0.4,
          }}
        >
          {formatDateTime(shift.started_at)}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: spacing.md,
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: borderRadius.round,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: fatigueColor,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: fatigueColor,
            }}
          />
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: fatigueColor,
            }}
          >
            {getFatigueLabel(fatigueLevel)}
          </Text>
        </View>
      </FadeSlideIn>

      {/* Stats grid */}
      <FadeSlideIn fromY={12} delay={80}>
        <Text
          style={{
            ...typeScale.caption,
            color: colors.inkMuted,
            marginBottom: spacing.sm,
          }}
        >
          Données du trajet
        </Text>
        <Card>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            <DetailStat
              label="Durée"
              value={formatDuration(shift.duration_h ?? 0)}
              mono
            />
            <DetailStat
              label="Fatigue moy."
              value={
                shift.avg_fatigue_score
                  ? `${Math.round(shift.avg_fatigue_score * 100)}%`
                  : '—'
              }
              mono
            />
            <DetailStat
              label="Fatigue max"
              value={
                shift.max_fatigue_score
                  ? `${Math.round(shift.max_fatigue_score * 100)}%`
                  : '—'
              }
              mono
              color={fatigueColor}
            />
            <DetailStat
              label="Statut"
              value={isCompleted ? 'Terminé' : 'En cours'}
            />
          </View>
        </Card>
      </FadeSlideIn>

      {/* History chart */}
      {fatigueHistory.length > 0 && (
        <FadeSlideIn fromY={12} delay={160}>
          <Text
            style={{
              ...typeScale.caption,
              color: colors.inkMuted,
              marginBottom: spacing.sm,
            }}
          >
            Évolution de la fatigue
          </Text>
          <FatigueHistoryChart history={fatigueHistory} height={160} />
        </FadeSlideIn>
      )}
    </Screen>
  );
}

function BackLink({ onPress }: { onPress: () => void }) {
  const { colors, fonts, spacing, typeScale } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <ChevronLeft size={18} color={colors.inkMuted} strokeWidth={2} />
      <Text
        style={{
          ...typeScale.bodyMd,
          color: colors.inkMuted,
          marginLeft: 4,
        }}
      >
        Retour
      </Text>
    </Pressable>
  );
}

function DetailStat({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  const { colors, fonts, spacing, typeScale } = useTheme();
  return (
    <View
      style={{
        width: '50%',
        paddingVertical: spacing.sm,
      }}
    >
      <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: mono ? fonts.mono : fonts.bodySemibold,
          fontSize: 18,
          lineHeight: 24,
          color: color ?? colors.ink,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

