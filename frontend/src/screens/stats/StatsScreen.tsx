import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Portal, Dialog, Button as PaperButton } from 'react-native-paper';
import { Svg, Rect, Text as SvgText, Circle, Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import FadeSlideIn from '@/components/ui/FadeSlideIn';

import { useAuthStore } from '@/store';
import { shiftsApi } from '@/services';
import Screen from '@/components/layout/Screen';
import Card from '@/components/ui/Card';
import { SkeletonStack } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDuration } from '@/utils/formatters';
import {
  DriverStatsResponse,
  FeatureImportanceResponse,
} from '@/types/api';

export default function StatsScreen() {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const { driver } = useAuthStore();
  const [stats, setStats] = useState<DriverStatsResponse | null>(null);
  const [featureImportance, setFeatureImportance] =
    useState<FeatureImportanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<{
    name: string;
    importance: number;
    description: string;
  } | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const loadStats = useCallback(async () => {
    if (!driver) return;
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, featureData] = await Promise.all([
        shiftsApi.getDriverStats(driver.id),
        shiftsApi.getFeatureImportance(),
      ]);
      setStats(statsData);
      setFeatureImportance(featureData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setIsLoading(false);
    }
  }, [driver]);

  useFocusEffect(
    useCallback(() => {
      if (driver) loadStats();
    }, [driver, loadStats])
  );

  if (isLoading && !stats) {
    return (
      <Screen
        edges={{ top: true, bottom: true }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <SkeletonStack rows={5} rowHeight={80} gap={spacing.md} />
      </Screen>
    );
  }

  if (error) {
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
          Petit souci
        </Text>
        <Text
          style={{
            ...typeScale.bodyMd,
            color: colors.inkMuted,
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}
        >
          {error}
        </Text>
        <Button variant="primary" size="md" onPress={loadStats}>
          Réessayer
        </Button>
      </Screen>
    );
  }

  const totalShifts = stats?.total_shifts ?? 0;
  const totalHours = stats?.total_driving_hours ?? 0;
  const fatigueDist = stats?.fatigue_distribution ?? {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  };
  const totalFatigue =
    Object.values(fatigueDist).reduce((a, b) => a + b, 0) || 1;
  const fatigueTrend = stats?.fatigue_trend_7_days || [];

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
      {/* Hero header */}
      <FadeSlideIn duration={360}>
        <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>
          Vos données
        </Text>
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontSize: 36,
            lineHeight: 44,
            color: colors.ink,
            marginTop: 4,
            letterSpacing: -0.4,
          }}
        >
          Statistiques
        </Text>
      </FadeSlideIn>

      {/* Overview */}
      <FadeSlideIn fromY={12} delay={80}>
        <Text
          style={{
            ...typeScale.caption,
            color: colors.inkMuted,
            marginBottom: spacing.sm,
          }}
        >
          Vue d'ensemble
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Tile label="Trajets" value={String(totalShifts)} />
          <Tile label="Heures" value={formatDuration(totalHours)} mono />
        </View>
      </FadeSlideIn>

      {/* Distribution */}
      {stats && (
        <FadeSlideIn fromY={12} delay={160}>
          <Text
            style={{
              ...typeScale.caption,
              color: colors.inkMuted,
              marginBottom: spacing.sm,
            }}
          >
            Distribution de fatigue
          </Text>
          <Card>
            <PieChart
              data={[
                {
                  label: 'Faible',
                  value: fatigueDist.low,
                  color: colors.fatigueRest,
                },
                {
                  label: 'Modéré',
                  value: fatigueDist.moderate,
                  color: colors.fatigueWatch,
                },
                {
                  label: 'Élevé',
                  value: fatigueDist.high,
                  color: colors.fatigueAlert,
                },
                {
                  label: 'Critique',
                  value: fatigueDist.critical,
                  color: colors.fatigueStop,
                },
              ]}
            />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.md,
                marginTop: spacing.md,
                justifyContent: 'center',
              }}
            >
              <Legend
                label="Faible"
                value={fatigueDist.low}
                total={totalFatigue}
                color={colors.fatigueRest}
              />
              <Legend
                label="Modéré"
                value={fatigueDist.moderate}
                total={totalFatigue}
                color={colors.fatigueWatch}
              />
              <Legend
                label="Élevé"
                value={fatigueDist.high}
                total={totalFatigue}
                color={colors.fatigueAlert}
              />
              <Legend
                label="Critique"
                value={fatigueDist.critical}
                total={totalFatigue}
                color={colors.fatigueStop}
              />
            </View>
          </Card>
        </FadeSlideIn>
      )}

      {/* Trend */}
      {fatigueTrend.length > 0 && (
        <FadeSlideIn fromY={12} delay={240}>
          <Text
            style={{
              ...typeScale.caption,
              color: colors.inkMuted,
              marginBottom: spacing.sm,
            }}
          >
            Tendance sur 7 jours
          </Text>
          <Card>
            <FatigueTrendChart data={fatigueTrend} />
          </Card>
        </FadeSlideIn>
      )}

      {/* Feature importance */}
      {featureImportance && (
        <FadeSlideIn fromY={12} delay={320}>
          <Text
            style={{
              ...typeScale.caption,
              color: colors.inkMuted,
              marginBottom: spacing.sm,
            }}
          >
            Facteurs de fatigue
          </Text>
          <Card>
            <FeatureImportanceChart
              featureImportance={featureImportance.feature_importance}
              ranking={featureImportance.ranking}
              onFeaturePress={(name, importance, description) => {
                setSelectedFeature({ name, importance, description });
                setDialogVisible(true);
              }}
            />
          </Card>
        </FadeSlideIn>
      )}

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: borderRadius.lg,
          }}
        >
          <Dialog.Title
            style={{
              fontFamily: fonts.display,
              color: colors.ink,
            }}
          >
            {selectedFeature?.name}
          </Dialog.Title>
          <Dialog.Content>
            {selectedFeature && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      ...typeScale.caption,
                      color: colors.inkMuted,
                      marginRight: spacing.sm,
                    }}
                  >
                    Importance
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 16,
                      color: getFeatureColor(selectedFeature.importance, colors),
                    }}
                  >
                    {Math.round(selectedFeature.importance * 100)}%
                  </Text>
                </View>
                <Text
                  style={{
                    ...typeScale.bodyMd,
                    color: colors.ink,
                    lineHeight: 22,
                  }}
                >
                  {selectedFeature.description}
                </Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton
              onPress={() => setDialogVisible(false)}
              textColor={colors.accent}
            >
              Fermer
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

// ----------------------------------------------------------------------
function Tile({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
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
          fontFamily: mono ? fonts.mono : fonts.display,
          fontSize: 28,
          lineHeight: 34,
          color: colors.ink,
          marginTop: spacing.sm,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function PieChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const { colors } = useTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const size = 180;
  const radius = size / 2;
  const center = size / 2;
  let currentAngle = 0;

  const slices = data.map((item) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angle - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData =
      angle >= 360
        ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${
            center - 0.01
          } ${center - radius} Z`
        : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <Path
        key={item.label}
        d={pathData}
        fill={item.color}
        stroke={colors.surfaceElevated}
        strokeWidth="2"
      />
    );
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={size} height={size}>
        {slices}
      </Svg>
    </View>
  );
}

function Legend({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const { colors, fonts, typeScale } = useTheme();
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        }}
      />
      <Text style={{ ...typeScale.bodySm, color: colors.inkMuted }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 12,
          color: colors.ink,
        }}
      >
        {percentage}%
      </Text>
    </View>
  );
}

function FatigueTrendChart({
  data,
}: {
  data: {
    date: string;
    avg_fatigue_score: number;
    snapshot_count: number;
  }[];
}) {
  const { colors, fonts, spacing } = useTheme();
  if (!data || data.length === 0) {
    return (
      <Text
        style={{
          color: colors.inkMuted,
          textAlign: 'center',
          padding: spacing.lg,
        }}
      >
        Aucune donnée de tendance disponible
      </Text>
    );
  }

  const width = Dimensions.get('window').width - spacing.lg * 2 - spacing.md * 2;
  const height = 160;
  const padding = 28;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxFatigue = Math.max(...data.map((d) => d.avg_fatigue_score), 1);

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1 || 1)) * chartWidth,
    y: height - padding - (d.avg_fatigue_score / maxFatigue) * chartHeight,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${padding + chartWidth} ${height - padding} L ${padding} ${
    height - padding
  } Z`;

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg width={width} height={height}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <Rect
            key={i}
            x={padding}
            y={padding + ratio * chartHeight}
            width={chartWidth}
            height="1"
            fill={colors.hairline}
          />
        ))}

        {/* Area */}
        <Path d={areaD} fill={colors.accent} opacity="0.10" />

        {/* Line */}
        <Path
          d={pathD}
          fill="none"
          stroke={colors.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={colors.surfaceElevated}
            stroke={colors.accent}
            strokeWidth="2"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
          const date = new Date(d.date);
          const label = date.toLocaleDateString('fr-FR', { weekday: 'short' });
          return (
            <SvgText
              key={i}
              x={x}
              y={height - 4}
              fontSize="10"
              fontFamily={fonts.bodyMedium}
              fill={colors.inkMuted}
              textAnchor="middle"
            >
              {label.toUpperCase()}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function FeatureImportanceChart({
  featureImportance,
  ranking,
  onFeaturePress,
}: {
  featureImportance: Record<string, number>;
  ranking: string[];
  onFeaturePress: (
    name: string,
    importance: number,
    description: string
  ) => void;
}) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  if (!featureImportance || !ranking || ranking.length === 0) {
    return (
      <Text
        style={{
          color: colors.inkMuted,
          textAlign: 'center',
          padding: spacing.lg,
        }}
      >
        Aucune donnée d'importance disponible
      </Text>
    );
  }

  const sortedFeatures = ranking
    .map((feature) => ({
      feature,
      importance: featureImportance[feature] || 0,
    }))
    .sort((a, b) => b.importance - a.importance);

  const maxImportance = Math.max(
    ...sortedFeatures.map((f) => f.importance),
    0.01
  );

  const formatFeatureName = (name: string) => {
    const translations: Record<string, string> = {
      shift_duration_h: 'Durée du trajet',
      time_since_last_break_min: 'Depuis la dernière pause',
      is_night: 'Conduite de nuit',
      driving_ratio: 'Ratio de conduite',
      break_ratio_inv: 'Déficit de pauses',
      is_post_lunch_dip: 'Creux post-déjeuner',
      active_driving_h: 'Heures actives',
      hour_sin: 'Moment de la journée',
      hour_cos: 'Moment de la journée',
    };
    return translations[name] || name;
  };

  const getDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      shift_duration_h:
        'La durée totale du trajet depuis le démarrage. Plus le trajet est long, plus la fatigue augmente.',
      time_since_last_break_min:
        "Le temps écoulé depuis votre dernière pause. Au-delà de 2h sans pause, la fatigue augmente significativement.",
      is_night:
        'Conduite pendant la nuit (minuit à 6h). Le corps est naturellement plus fatigué pendant ces heures.',
      driving_ratio:
        "Proportion du temps passée à conduire réellement (vitesse > 5 km/h) par rapport au temps total.",
      break_ratio_inv:
        'Inverse du ratio de pauses. Un score élevé indique un manque de pauses régulières.',
      is_post_lunch_dip:
        'Période de 13h à 16h où la vigilance diminue naturellement.',
      active_driving_h:
        "Nombre d'heures de conduite effective (vitesse > 5 km/h).",
      hour_sin:
        "Représentation cyclique de l'heure pour capturer les variations circadiennes.",
      hour_cos: "Représentation cyclique complémentaire de l'heure.",
    };
    return descriptions[name] || 'Facteur influençant la fatigue au volant.';
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {sortedFeatures.map((item) => {
        const featureColor = getFeatureColor(item.importance, colors);
        return (
          <Pressable
            key={item.feature}
            onPress={() =>
              onFeaturePress(
                formatFeatureName(item.feature),
                item.importance,
                getDescription(item.feature)
              )
            }
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingVertical: 4,
            })}
          >
            <Text
              style={{
                width: 130,
                ...typeScale.bodySm,
                color: colors.ink,
                fontFamily: fonts.bodyMedium,
              }}
              numberOfLines={1}
            >
              {formatFeatureName(item.feature)}
            </Text>
            <View
              style={{
                flex: 1,
                height: 6,
                backgroundColor: colors.surfaceSunken,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${(item.importance / maxImportance) * 100}%`,
                  height: '100%',
                  backgroundColor: featureColor,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text
              style={{
                width: 36,
                textAlign: 'right',
                fontFamily: fonts.mono,
                fontSize: 12,
                color: featureColor,
              }}
            >
              {Math.round(item.importance * 100)}%
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getFeatureColor(importance: number, colors: any): string {
  if (importance > 0.25) return colors.fatigueStop;
  if (importance > 0.15) return colors.fatigueAlert;
  if (importance > 0.05) return colors.fatigueWatch;
  return colors.fatigueRest;
}
