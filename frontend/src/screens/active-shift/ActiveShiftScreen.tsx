import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import FadeSlideIn from '@/components/ui/FadeSlideIn';
import { Quote, Radio, Compass, Coffee, Sunset } from 'lucide-react-native';

import { useShiftStore, useFatigueStore } from '@/store';
import { cancelSessionEndReminder } from '@/services/notifications';
import { shiftsApi } from '@/services';
import { useShift } from '@/hooks/useShift';
import FatigueGauge from '@/components/fatigue/FatigueGauge';
import Screen from '@/components/layout/Screen';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { getMinutesDifference } from '@/utils/formatters';
import type { MainTabsParamList } from '@/types/navigation';

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
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabsParamList>>();
  const { activeShift, clearActiveShift, isOnBreak, breakStartedAt, startBreak: storeStartBreak, endBreak: storeEndBreak } = useShiftStore();
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
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isTogglingBreak, setIsTogglingBreak] = useState(false);

  // Diagnostic: confirm activeShift state on every render
  console.log('🚗 ActiveShiftScreen render — activeShift:', activeShift?.shift_id ?? 'null');

  useEffect(() => {
    if (!activeShift) return;
    setTimeSinceStart(getMinutesDifference(activeShift.started_at));
    const interval = setInterval(() => {
      setTimeSinceStart(getMinutesDifference(activeShift.started_at));
      if (breakStartedAt) {
        setBreakMinutes(getMinutesDifference(breakStartedAt));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeShift, breakStartedAt]);

  const endShift = useCallback(async () => {
    console.log('🛑 endShift called, activeShift:', activeShift?.shift_id ?? 'null');
    if (!activeShift) {
      toast.warning('Aucune session active à terminer.');
      return;
    }
    setIsEnding(true);
    try {
      await shiftsApi.endShift(String(activeShift.shift_id));
      cancelSessionEndReminder();
      toast.success('Trajet terminé', 'Reposez-vous bien.');
      clearActiveShift();
      clearFatigueData();
    } catch (err) {
      console.error('endShift API error:', err);
      toast.error('Impossible de terminer le trajet', 'Vérifiez la connexion.');
    } finally {
      setIsEnding(false);
    }
  }, [activeShift, clearActiveShift, clearFatigueData, toast]);

  const cancelShift = useCallback(async () => {
    if (!activeShift) return;
    setIsCancelling(true);
    try {
      await shiftsApi.cancelShift(String(activeShift.shift_id));
      cancelSessionEndReminder();
      toast.info('Trajet annulé', 'La session a été supprimée.');
      clearActiveShift();
      clearFatigueData();
    } catch (err) {
      console.error('cancelShift error:', err);
      toast.error('Impossible d\'annuler le trajet', 'Vérifiez la connexion.');
    } finally {
      setIsCancelling(false);
    }
  }, [activeShift, clearActiveShift, clearFatigueData, toast]);

  const handleToggleBreak = useCallback(async () => {
    if (!activeShift) return;
    setIsTogglingBreak(true);
    try {
      if (isOnBreak) {
        const result = await shiftsApi.endBreak(String(activeShift.shift_id));
        storeEndBreak();
        toast.success(`Pause terminée (${result.duration_min.toFixed(0)} min)`, 'Bon courage !');
      } else {
        const result = await shiftsApi.startBreak(String(activeShift.shift_id));
        storeStartBreak(result.break_id, result.started_at);
        setBreakMinutes(0);
        toast.info('Pause démarrée', 'Reposez-vous bien.');
      }
    } catch {
      toast.error(isOnBreak ? 'Impossible de terminer la pause' : 'Impossible de démarrer la pause');
    } finally {
      setIsTogglingBreak(false);
    }
  }, [activeShift, isOnBreak, storeStartBreak, storeEndBreak, toast]);

  const handleCancelShift = useCallback(() => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Annuler le trajet ?\nCette session sera définitivement supprimée et n\'apparaîtra pas dans l\'historique.'
      );
      if (confirmed) cancelShift();
      return;
    }
    Alert.alert(
      'Annuler le trajet ?',
      'Cette session sera définitivement supprimée et n\'apparaîtra pas dans l\'historique.',
      [
        { text: 'Continuer le trajet', style: 'cancel' },
        { text: 'Annuler le trajet', style: 'destructive', onPress: cancelShift },
      ]
    );
  }, [cancelShift]);

  const handleEndShift = useCallback(() => {
    console.log('🟠 handleEndShift pressed, platform:', Platform.OS);
    // On web, Alert.alert uses window.confirm but button onPress handlers
    // are not reliably called — use window.confirm directly instead.
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Terminer la session ?\nLe suivi de fatigue s\'arrête et le trajet est archivé.'
      );
      if (confirmed) endShift();
      return;
    }
    Alert.alert(
      'Terminer la session ?',
      'Le suivi de fatigue s\'arrête et le trajet est archivé.',
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Terminer', style: 'destructive', onPress: endShift },
      ]
    );
  }, [endShift]);

  // No active shift — show clear empty state instead of broken UI
  if (!activeShift) {
    return (
      <Screen
        glow
        edges={{ top: true, bottom: true }}
        contentContainerStyle={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FadeSlideIn fromY={12} duration={420} style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.accentMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <Compass size={28} color={colors.accent} strokeWidth={1.8} />
          </View>
          <Text
            style={{
              fontFamily: fonts.displayItalic,
              fontSize: 28,
              lineHeight: 36,
              color: colors.ink,
              textAlign: 'center',
              letterSpacing: -0.3,
            }}
          >
            Aucune session en cours
          </Text>
          <Text
            style={{
              ...typeScale.bodyMd,
              color: colors.inkMuted,
              textAlign: 'center',
              marginTop: spacing.sm,
              maxWidth: 280,
            }}
          >
            Démarrez un trajet depuis le tableau de bord pour suivre votre
            fatigue en temps réel.
          </Text>
          <View style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('Dashboard')}
            >
              Tableau de bord
            </Button>
          </View>
        </FadeSlideIn>
      </Screen>
    );
  }

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
          <Card
            variant="accent"
            style={{
              paddingVertical: spacing.lg,
              borderColor: suggestion.is_end_of_day ? colors.fatigueStop : undefined,
              borderWidth: suggestion.is_end_of_day ? 1 : 0,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              {suggestion.is_end_of_day ? (
                <Sunset size={18} color={colors.fatigueStop} strokeWidth={2} style={{ marginTop: 4 }} />
              ) : (
                <Quote size={18} color={colors.accent} strokeWidth={2} style={{ marginTop: 4 }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.displayItalic, fontSize: 18, lineHeight: 26, color: colors.ink }}>
                  {suggestion.message}
                </Text>
                <Text style={{ ...typeScale.caption, color: colors.inkMuted, marginTop: spacing.sm }}>
                  {suggestion.is_end_of_day ? 'DriveWise · Recommandation fin de journée' : 'DriveWise · Suggestion personnalisée'}
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

      {/* --- Block 4b : break button --------------------------------- */}
      <FadeSlideIn fromY={8} duration={360} delay={360} style={{ marginBottom: spacing.lg }}>
        {isOnBreak ? (
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Coffee size={15} color={colors.fatigueWatch} strokeWidth={2} />
              <Text style={{ ...typeScale.bodyMd, color: colors.fatigueWatch, fontFamily: fonts.bodyMedium }}>
                En pause · {breakMinutes < 60
                  ? `${breakMinutes} min`
                  : `${Math.floor(breakMinutes / 60)}h ${breakMinutes % 60}min`}
              </Text>
            </View>
            <Button
              variant="subtle"
              size="md"
              fullWidth
              onPress={handleToggleBreak}
              loading={isTogglingBreak}
            >
              Reprendre la session
            </Button>
          </View>
        ) : (
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onPress={handleToggleBreak}
            loading={isTogglingBreak}
            icon={<Coffee size={15} color={colors.inkMuted} strokeWidth={2} />}
          >
            Déclarer une pause
          </Button>
        )}
      </FadeSlideIn>

      {/* --- Block 5 : end / cancel buttons ------------------------- */}
      <FadeSlideIn duration={380} delay={420} style={{ marginTop: 'auto', paddingTop: spacing.xl, gap: spacing.sm }}>
        <Button
          variant="subtle"
          size="lg"
          fullWidth
          onPress={handleEndShift}
          loading={isEnding}
          disabled={isCancelling}
        >
          Terminer la session
        </Button>
        <Button
          variant="destructive"
          size="sm"
          fullWidth
          onPress={handleCancelShift}
          loading={isCancelling}
          disabled={isEnding}
        >
          Annuler le trajet
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
