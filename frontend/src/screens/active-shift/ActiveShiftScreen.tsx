import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import FadeSlideIn from '@/components/ui/FadeSlideIn';
import { Quote, Radio } from 'lucide-react-native';

import { useShiftStore, useFatigueStore } from '@/store';
import { shiftsApi } from '@/services';
import { useShift } from '@/hooks/useShift';
import FatigueGauge from '@/components/fatigue/FatigueGauge';
import Screen from '@/components/layout/Screen';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { getMinutesDifference } from '@/utils/formatters';

/**
 * Format minutes as a session timer: 00:42 (under an hour) or 2:14 (with hours).
 * Kept Geist-Mono friendly so the digits never visually jump.
 */
function formatSessionDuration(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${String(Math.max(0, totalMinutes)).padStart(2, '0')} min`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}`;
}

export default function ActiveShiftScreen() {
  const { colors, fonts, spacing, typeScale } = useTheme();
  const toast = useToast();
  const { activeShift, clearActiveShift } = useShiftStore();
  const {
    currentFatigueLevel,
    currentFatigueScore,
    suggestion,
    clearFatigueData,
  } = useFatigueStore();

  const {
    isTracking,
    snapshotCount,
    lastSnapshotTime,
    error: locationError,
  } = useShift({ snapshotInterval: 30000, enableBackgroundTracking: true });

  const [timeSinceStart, setTimeSinceStart] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!activeShift) return;
    setTimeSinceStart(getMinutesDifference(activeShift.started_at));
    const interval = setInterval(() => {
      setTimeSinceStart(getMinutesDifference(activeShift.started_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeShift]);

  const endShift = useCallback(async () => {
    if (!activeShift) return;
    setIsEnding(true);
    try {
      await shiftsApi.endShift(String(activeShift.shift_id));
      toast.success('Trajet terminé', 'Reposez-vous bien.');
      clearActiveShift();
      clearFatigueData();
    } catch (err) {
      toast.error('Impossible de terminer le trajet', 'Vérifiez la connexion.');
    } finally {
      setIsEnding(false);
    }
  }, [activeShift, clearActiveShift, clearFatigueData, toast]);

  const handleEndShift = useCallback(() => {
    Alert.alert(
      'Terminer la session ?',
      'Le suivi de fatigue s\'arrête et le trajet est archivé.',
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Terminer', style: 'destructive', onPress: endShift },
      ]
    );
  }, [endShift]);

  return (
    <Screen
      scrollable
      glow
      edges={{ top: true, bottom: true }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
      }}
    >
      {/* --- Block 1 : session timer ---------------------------------- */}
      <FadeSlideIn fromY={12} duration={420} style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
        <Text
          style={{
            ...typeScale.caption,
            color: colors.inkMuted,
          }}
        >
          Durée de session
        </Text>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 44,
            lineHeight: 52,
            color: colors.ink,
            marginTop: spacing.xs,
            letterSpacing: -1,
          }}
          accessibilityLabel={`Session en cours, ${formatSessionDuration(timeSinceStart)}`}
        >
          {formatSessionDuration(timeSinceStart)}
        </Text>
        <View
          style={{
            width: 40,
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.hairlineStrong,
            marginTop: spacing.md,
          }}
        />
      </FadeSlideIn>

      {/* --- Block 2 : the gauge -------------------------------------- */}
      <FadeSlideIn fromY={0} fromScale={0.92} duration={520} delay={100} style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
        <FatigueGauge
          fatigueLevel={currentFatigueLevel}
          fatigueScore={currentFatigueScore}
          size="large"
          showLabel={false}
          showMessage={true}
        />
      </FadeSlideIn>

      {/* --- Block 3 : suggestion ------------------------------------- */}
      {suggestion ? (
        <FadeSlideIn fromY={12} duration={420} delay={220} style={{ marginBottom: spacing.xl }}>
          <Card variant="accent" style={{ paddingVertical: spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.sm,
              }}
            >
              <Quote
                size={18}
                color={colors.accent}
                strokeWidth={2}
                style={{ marginTop: 4 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.displayItalic,
                    fontSize: 18,
                    lineHeight: 26,
                    color: colors.ink,
                  }}
                >
                  {suggestion.message}
                </Text>
                <Text
                  style={{
                    ...typeScale.caption,
                    color: colors.inkMuted,
                    marginTop: spacing.sm,
                  }}
                >
                  DriveWise · Suggestion personnalisée
                </Text>
              </View>
            </View>
          </Card>
        </FadeSlideIn>
      ) : null}

      {/* --- Block 4 : minimal status row ----------------------------- */}
      <FadeSlideIn fromY={10} duration={380} delay={320} style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.lg,
          marginBottom: spacing.xl,
        }}>
        <StatusPill
          icon={<Radio size={13} color={isTracking ? colors.fatigueRest : colors.inkSubtle} />}
          label={isTracking ? 'GPS actif' : 'GPS inactif'}
          color={isTracking ? colors.fatigueRest : colors.inkSubtle}
        />
        <Text
          style={{
            ...typeScale.caption,
            color: colors.inkMuted,
          }}
        >
          {snapshotCount} {snapshotCount > 1 ? 'mesures' : 'mesure'}
        </Text>
        {lastSnapshotTime ? (
          <Text
            style={{
              fontFamily: fonts.monoRegular,
              fontSize: 11,
              color: colors.inkSubtle,
              letterSpacing: 0.4,
            }}
          >
            {lastSnapshotTime.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : null}
      </FadeSlideIn>

      {locationError ? (
        <Text
          style={{
            ...typeScale.bodySm,
            color: colors.error,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
        >
          GPS : {typeof locationError === 'string' ? locationError : locationError?.message}
        </Text>
      ) : null}

      {/* --- Block 5 : end button ------------------------------------ */}
      <FadeSlideIn duration={380} delay={420} style={{ alignItems: 'center', marginTop: 'auto', paddingTop: spacing.xl }}>
        <Button
          variant="subtle"
          size="lg"
          fullWidth
          onPress={handleEndShift}
          loading={isEnding}
        >
          Terminer la session
        </Button>
      </FadeSlideIn>
    </Screen>
  );
}

// ---- Tiny inline status pill ------------------------------------------
function StatusPill({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  const { fonts } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      <Text
        style={{
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
          letterSpacing: 1.0,
          textTransform: 'uppercase',
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
