import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FadeSlideIn from '@/components/ui/FadeSlideIn';
import { ArrowRight, Sunrise } from 'lucide-react-native';

import { useAuthStore, useShiftStore } from '@/store';
import { shiftsApi } from '@/services';
import Screen from '@/components/layout/Screen';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { SkeletonStack } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { ShiftListItem } from '@/types/api';
import { MainTabsParamList } from '@/types/navigation';

/**
 * Greeting that adapts to the local hour. Drivers in France will see
 * "Bonsoir" past 18h, "Bonne nuit" past 22h, etc.
 */
function getGreeting(hour: number): string {
  if (hour < 5) return 'Bonne nuit';
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  if (hour < 22) return 'Bonsoir';
  return 'Bonne nuit';
}

export default function DashboardScreen() {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainTabsParamList>>();
  const toast = useToast();
  const { driver } = useAuthStore();
  const { activeShift, setActiveShift } = useShiftStore();

  const [stats, setStats] = useState<{
    total_shifts: number;
    total_driving_hours: number;
  } | null>(null);
  const [recentShifts, setRecentShifts] = useState<ShiftListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const loadData = useCallback(async () => {
    if (!driver) return;
    try {
      const [statsData, shiftsData] = await Promise.all([
        shiftsApi.getDriverStats(driver.id),
        shiftsApi.listShifts({ driver_id: driver.id, page: 1, per_page: 3 }),
      ]);
      setStats({
        total_shifts: statsData.total_shifts,
        total_driving_hours: statsData.total_driving_hours,
      });
      setRecentShifts(shiftsData.shifts);
    } catch (err) {
      // surface but don't block the screen
      toast.error('Données indisponibles', 'Vérifiez la connexion.');
    } finally {
      setIsFirstLoad(false);
    }
  }, [driver, toast]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartShift = async () => {
    if (!driver) return;
    setIsStarting(true);
    try {
      const shift = await shiftsApi.startShift(driver.id);
      setActiveShift(shift);
      navigation.navigate('ActiveShift');
    } catch (err) {
      toast.error('Impossible de démarrer le trajet');
    } finally {
      setIsStarting(false);
    }
  };

  const handleContinueShift = () => {
    if (activeShift) navigation.navigate('ActiveShift');
  };

  const greeting = getGreeting(new Date().getHours());
  const firstName = driver?.username?.split(' ')[0] ?? 'Conducteur';

  return (
    <Screen
      scrollable
      glow
      refreshing={refreshing}
      onRefresh={handleRefresh}
      edges={{ top: true, bottom: true }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.xl,
      }}
    >
      {/* --- Greeting ----------------------------------------------- */}
      <FadeSlideIn duration={360}>
        <Text
          style={{
            ...typeScale.caption,
            color: colors.inkMuted,
          }}
        >
          {greeting}
        </Text>
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontSize: 40,
            lineHeight: 48,
            color: colors.ink,
            marginTop: 4,
            letterSpacing: -0.4,
          }}
        >
          {firstName}.
        </Text>
        <Text
          style={{
            ...typeScale.bodyLg,
            color: colors.inkMuted,
            marginTop: 4,
          }}
        >
          {activeShift
            ? 'Votre trajet est en cours.'
            : 'Prêt à reprendre la route ?'}
        </Text>
      </FadeSlideIn>

      {/* --- Active shift hero OR start CTA ------------------------- */}
      <FadeSlideIn fromY={12} delay={80}>
        {activeShift ? (
          <Card
            variant="accent"
            interactive
            onPress={handleContinueShift}
            style={{ paddingVertical: spacing.lg }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sunrise size={22} color={colors.onAccent} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...typeScale.caption,
                    color: colors.accent,
                  }}
                >
                  En cours
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 20,
                    lineHeight: 26,
                    color: colors.ink,
                  }}
                >
                  Trajet actif
                </Text>
                <Text
                  style={{
                    ...typeScale.bodySm,
                    color: colors.inkMuted,
                    marginTop: 2,
                    fontFamily: fonts.monoRegular,
                  }}
                >
                  Débuté {formatDateTime(activeShift.started_at)}
                </Text>
              </View>
              <ArrowRight size={20} color={colors.accent} strokeWidth={2} />
            </View>
          </Card>
        ) : (
          <Card style={{ paddingVertical: spacing.xl }}>
            <Text
              style={{
                ...typeScale.caption,
                color: colors.inkMuted,
                marginBottom: spacing.xs,
              }}
            >
              Nouvelle session
            </Text>
            <Text
              style={{
                fontFamily: fonts.displayItalic,
                fontSize: 22,
                lineHeight: 30,
                color: colors.ink,
                marginBottom: spacing.md,
              }}
            >
              Quand vous êtes prêt.
            </Text>
            <Text
              style={{
                ...typeScale.bodyMd,
                color: colors.inkMuted,
                marginBottom: spacing.lg,
                maxWidth: 280,
              }}
            >
              Lance le suivi GPS et la détection de fatigue en temps réel.
            </Text>
            <Button
              variant="primary"
              size="lg"
              onPress={handleStartShift}
              loading={isStarting}
            >
              Démarrer le trajet
            </Button>
          </Card>
        )}
      </FadeSlideIn>

      {/* --- Stats grid --------------------------------------------- */}
      <FadeSlideIn fromY={12} delay={160}>
        <Text
          style={{
            ...typeScale.caption,
            color: colors.inkMuted,
            marginBottom: spacing.sm,
          }}
        >
          Activité globale
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatTile
            label="Trajets"
            value={stats?.total_shifts ?? null}
            loading={isFirstLoad && !stats}
          />
          <StatTile
            label="Heures"
            value={
              stats?.total_driving_hours != null
                ? formatDuration(stats.total_driving_hours)
                : null
            }
            loading={isFirstLoad && !stats}
          />
        </View>
      </FadeSlideIn>

      {/* --- Recent shifts ------------------------------------------ */}
      <FadeSlideIn fromY={12} delay={240}>
        <Text
          style={{
            ...typeScale.caption,
            color: colors.inkMuted,
            marginBottom: spacing.sm,
          }}
        >
          Trajets récents
        </Text>
        {isFirstLoad && recentShifts.length === 0 ? (
          <SkeletonStack rows={3} rowHeight={56} gap={8} />
        ) : recentShifts.length === 0 ? (
          <Card variant="outlined">
            <Text style={{ ...typeScale.bodyMd, color: colors.inkMuted }}>
              Aucun trajet enregistré pour l'instant.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {recentShifts.map((shift) => (
              <RecentShiftRow key={shift.id} shift={shift} />
            ))}
          </View>
        )}
      </FadeSlideIn>
    </Screen>
  );
}

// ---- Stat tile (Fraunces digit + caption label) ------------------------
function StatTile({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | string | null;
  loading: boolean;
}) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surfaceElevated,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.hairline,
      }}
    >
      <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 30,
          lineHeight: 36,
          color: colors.ink,
          marginTop: spacing.sm,
          letterSpacing: -0.4,
        }}
      >
        {loading ? '—' : value ?? '0'}
      </Text>
    </View>
  );
}

// ---- Recent shift row (compact, hairline-only) -------------------------
function RecentShiftRow({ shift }: { shift: ShiftListItem }) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceElevated,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.hairline,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor:
            shift.status === 'completed'
              ? colors.fatigueRest
              : colors.fatigueWatch,
          marginRight: spacing.md,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...typeScale.bodyMd,
            color: colors.ink,
            fontFamily: fonts.bodyMedium,
          }}
        >
          {formatDateTime(shift.started_at)}
        </Text>
        <Text
          style={{
            ...typeScale.bodySm,
            color: colors.inkMuted,
            marginTop: 2,
            fontFamily: fonts.monoRegular,
          }}
        >
          {formatDuration(shift.duration_h ?? 0)}
        </Text>
      </View>
      <Text
        style={{
          ...typeScale.bodySm,
          color: colors.inkSubtle,
        }}
      >
        {shift.status === 'completed' ? 'Terminé' : 'Actif'}
      </Text>
    </View>
  );
}
