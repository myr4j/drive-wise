import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Modal, TouchableOpacity } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Portal, Dialog } from 'react-native-paper';
import { Svg, G, Rect, Text as SvgText, Circle, Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthStore } from '@/store';
import { shiftsApi } from '@/services';
import Screen from '@/components/layout/Screen';
import StatCard from '@/components/shift/StatCard';
import { colors, spacing, borderRadius } from '@/utils/theme';
import { formatDuration } from '@/utils/formatters';
import { DriverStatsResponse, FeatureImportanceResponse } from '@/types/api';

export default function StatsScreen() {
  const { driver } = useAuthStore();
  const [stats, setStats] = React.useState<DriverStatsResponse | null>(null);
  const [featureImportance, setFeatureImportance] = React.useState<FeatureImportanceResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = React.useState<{name: string; importance: number; description: string} | null>(null);
  const [dialogVisible, setDialogVisible] = React.useState(false);

  React.useEffect(() => {
    loadStats();
  }, [driver]);

  // Refresh stats when screen is focused (user navigates back)
  useFocusEffect(
    React.useCallback(() => {
      if (driver) {
        loadStats();
      }
    }, [driver])
  );

  const loadStats = async () => {
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
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(errorMessage);
      console.error('Error loading stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadStats();
  };

  if (isLoading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Chargement des statistiques...
        </Text>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.errorContainer}>
        <Text variant="headlineMedium" style={styles.errorTitle}>Oups !</Text>
        <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={handleRetry} style={styles.retryButton}>
          Réessayer
        </Button>
      </Screen>
    );
  }

  const totalShifts = stats?.total_shifts ?? 0;
  const totalHours = stats?.total_driving_hours ?? 0;
  const fatigueDist = stats?.fatigue_distribution ?? { low: 0, moderate: 0, high: 0, critical: 0 };
  const totalFatigue = Object.values(fatigueDist).reduce((a, b) => a + b, 0) || 1;
  // Backend returns fatigue_trend_7_days
  const fatigueTrend = stats?.fatigue_trend_7_days || [];

  return (
    <Screen scrollable style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Statistiques
        </Text>
      </View>

      {/* Overview Stats */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Vue d'ensemble
        </Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Trajets"
            value={totalShifts}
            color="primary"
          />
          <StatCard
            title="Heures de conduite"
            value={formatDuration(totalHours)}
            color="info"
          />
        </View>
      </View>

      {/* Fatigue Distribution */}
      {stats && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Distribution de fatigue
          </Text>
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <PieChart
                data={[
                  { label: 'Faible', value: fatigueDist.low, color: colors.fatigueLow },
                  { label: 'Modéré', value: fatigueDist.moderate, color: colors.fatigueModerate },
                  { label: 'Élevé', value: fatigueDist.high, color: colors.fatigueHigh },
                  { label: 'Critique', value: fatigueDist.critical, color: colors.fatigueCritical },
                ]}
              />
              <View style={styles.legend}>
                <LegendItem label="Faible" value={fatigueDist.low} total={totalFatigue} color={colors.fatigueLow} />
                <LegendItem label="Modéré" value={fatigueDist.moderate} total={totalFatigue} color={colors.fatigueModerate} />
                <LegendItem label="Élevé" value={fatigueDist.high} total={totalFatigue} color={colors.fatigueHigh} />
                <LegendItem label="Critique" value={fatigueDist.critical} total={totalFatigue} color={colors.fatigueCritical} />
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* 7-Day Trend */}
      {fatigueTrend.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Tendance sur 7 jours
          </Text>
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <FatigueTrendChart data={fatigueTrend} />
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Feature Importance */}
      {featureImportance && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Facteurs de fatigue
          </Text>
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <FeatureImportanceChart
                featureImportance={featureImportance.feature_importance}
                ranking={featureImportance.ranking}
                onFeaturePress={(name, importance, description) => {
                  setSelectedFeature({ name, importance, description });
                  setDialogVisible(true);
                }}
              />
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Feature Detail Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {selectedFeature?.name}
          </Dialog.Title>
          <Dialog.Content>
            {selectedFeature && (
              <>
                <View style={styles.dialogImportance}>
                  <Text variant="bodyMedium">Importance: </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: getFeatureColor(selectedFeature.importance) }}>
                    {Math.round(selectedFeature.importance * 100)}%
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.dialogDescription}>
                  {selectedFeature.description}
                </Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.footer} />
    </Screen>
  );
}

// Pie Chart Component
function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
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

    const pathData = angle >= 360
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} Z`
      : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <Path
        key={item.label}
        d={pathData}
        fill={item.color}
        stroke={colors.white}
        strokeWidth="2"
      />
    );
  });

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {slices}
      </Svg>
    </View>
  );
}

// Legend Item
function LegendItem({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text variant="bodySmall" style={styles.legendLabel}>{label}</Text>
      <Text variant="bodySmall" style={styles.legendValue}>{percentage}%</Text>
    </View>
  );
}

// Fatigue Trend Chart
function FatigueTrendChart({ data }: { data: { date: string; avg_fatigue_score: number; snapshot_count: number }[] }) {
  // Guard clause - don't render if no data
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text variant="bodyMedium" style={styles.emptyChart}>
          Aucune donnée de tendance disponible
        </Text>
      </View>
    );
  }

  const width = Dimensions.get('window').width - spacing.md * 4;
  const height = 150;
  const padding = 30;
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

  const areaD = `${pathD} L ${padding + chartWidth} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <View style={styles.chartContainer}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <Rect
            key={i}
            x={padding}
            y={padding + ratio * chartHeight}
            width={chartWidth}
            height="1"
            fill={colors.lightGray}
            opacity="0.5"
          />
        ))}

        {/* Area fill */}
        <Path d={areaD} fill={colors.primary} opacity="0.2" />

        {/* Line */}
        <Path d={pathD} fill="none" stroke={colors.primary} strokeWidth="3" />

        {/* Points */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="5" fill={colors.primary} stroke={colors.white} strokeWidth="2" />
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
              y={height - 5}
              fontSize="10"
              fill={colors.gray}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Y-axis labels */}
        <SvgText x={5} y={padding + 5} fontSize="10" fill={colors.gray}>100%</SvgText>
        <SvgText x={5} y={height - padding} fontSize="10" fill={colors.gray}>0%</SvgText>
      </Svg>
    </View>
  );
}

// Feature Importance Chart
function FeatureImportanceChart({
  featureImportance,
  ranking,
  onFeaturePress
}: {
  featureImportance: Record<string, number>;
  ranking: string[];
  onFeaturePress: (name: string, importance: number, description: string) => void;
}) {
  // Guard clause - don't render if no data
  if (!featureImportance || !ranking || ranking.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text variant="bodyMedium" style={styles.emptyChart}>
          Aucune donnée d'importance disponible
        </Text>
      </View>
    );
  }

  const sortedFeatures = ranking.map((feature) => ({
    feature,
    importance: featureImportance[feature] || 0,
  })).sort((a, b) => b.importance - a.importance);

  const maxImportance = Math.max(...sortedFeatures.map((f) => f.importance), 0.01);

  const formatFeatureName = (name: string) => {
    const translations: Record<string, string> = {
      shift_duration_h: 'Durée du trajet',
      time_since_last_break_min: 'Temps depuis dernière pause',
      is_night: 'Conduite de nuit',
      driving_ratio: 'Ratio de conduite',
      break_ratio_inv: 'Déficit de pauses',
      is_post_lunch_dip: 'Creux post-déjeuner',
      active_driving_h: 'Heures de conduite actives',
      hour_sin: 'Moment de la journée',
      hour_cos: 'Moment de la journée',
    };
    return translations[name] || name;
  };

  const getFeatureDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      shift_duration_h: 'La durée totale du trajet depuis le démarrage. Plus le trajet est long, plus la fatigue augmente.',
      time_since_last_break_min: 'Le temps écoulé depuis votre dernière pause. Au-delà de 2h sans pause, la fatigue augmente significativement.',
      is_night: 'Conduite pendant la nuit (minuit à 6h). Le corps est naturellement plus fatigué pendant ces heures.',
      driving_ratio: 'Proportion du temps passée à conduire réellement (vitesse > 5 km/h) par rapport au temps total du trajet.',
      break_ratio_inv: 'Inverse du ratio de pauses. Un score élevé indique un manque de pauses régulières.',
      is_post_lunch_dip: 'Période de 13h à 16h où la vigilance diminue naturellement après le déjeuner.',
      active_driving_h: 'Nombre d\'heures de conduite effective (vitesse > 5 km/h).',
      hour_sin: 'Représentation cyclique de l\'heure pour capturer les variations circadiennes de fatigue.',
      hour_cos: 'Représentation cyclique complémentaire de l\'heure.',
    };
    return descriptions[name] || 'Facteur influençant la fatigue au volant.';
  };

  return (
    <View style={styles.featureList}>
      {sortedFeatures.map((item, index) => (
        <TouchableOpacity
          key={item.feature}
          onPress={() => onFeaturePress(formatFeatureName(item.feature), item.importance, getFeatureDescription(item.feature))}
          activeOpacity={0.7}
        >
          <View style={styles.featureItem}>
            <Text variant="bodySmall" style={styles.featureName}>
              {formatFeatureName(item.feature)}
            </Text>
            <View style={styles.featureBarContainer}>
              <View
                style={[
                  styles.featureBar,
                  {
                    width: `${(item.importance / maxImportance) * 100}%`,
                    backgroundColor: getFeatureColor(item.importance),
                  },
                ]}
              />
            </View>
            <Text variant="bodySmall" style={styles.featureValue}>
              {Math.round(item.importance * 100)}%
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function getFeatureColor(importance: number): string {
  if (importance > 0.25) return colors.fatigueCritical;
  if (importance > 0.15) return colors.fatigueHigh;
  if (importance > 0.05) return colors.fatigueModerate;
  return colors.fatigueLow;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  title: {
    fontWeight: 'bold',
  },
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.darkGray,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  emptyChart: {
    color: colors.gray,
    padding: spacing.lg,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    color: colors.darkGray,
  },
  legendValue: {
    fontWeight: '600',
    color: colors.darkGray,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureName: {
    width: 100,
    color: colors.darkGray,
  },
  featureBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
  },
  featureBar: {
    height: '100%',
    borderRadius: 6,
  },
  featureValue: {
    width: 40,
    textAlign: 'right',
    fontWeight: '600',
    color: colors.darkGray,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    minWidth: 120,
  },
  dialogImportance: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dialogDescription: {
    lineHeight: 22,
  },
  footer: {
    height: spacing.xl,
  },
});
