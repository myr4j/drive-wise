import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Svg, G, Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

import { FatigueHistoryPoint } from '@/types/api';
import { colors, spacing, borderRadius } from '@/utils/theme';
import { getFatigueColor } from '@/utils/formatters';

interface FatigueHistoryChartProps {
  history: FatigueHistoryPoint[];
  height?: number;
}

export default function FatigueHistoryChart({
  history,
  height = 150,
}: FatigueHistoryChartProps) {
  if (history.length === 0) {
    return (
      <Card style={styles.container} mode="outlined">
        <Card.Content>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Aucune donnée de fatigue disponible
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const maxPoints = 20;
  const displayHistory = history.slice(-maxPoints);
  
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.md * 4; // Account for padding
  const padding = 30;
  const chartHeight = height - padding * 2;

  const maxScore = Math.max(...displayHistory.map((p) => p.fatigueScore), 1);

  const points = displayHistory.map((point, index) => {
    const x = padding + (index / (displayHistory.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = height - padding - (point.fatigueScore / maxScore) * chartHeight;
    return { x, y, color: getFatigueColor(point.fatigueLevel), score: point.fatigueScore };
  });

  // Build path for line chart
  const pathD = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  // Build area fill path
  const areaD = points.length > 1
    ? `${pathD} L ${padding + (chartWidth - padding * 2)} ${height - padding} L ${padding} ${height - padding} Z`
    : '';

  return (
    <Card style={styles.container} mode="outlined">
      <Card.Content>
        <Text variant="titleSmall" style={styles.title}>
          Historique de fatigue
        </Text>
        <View style={[styles.chartContainer, { height }]}>
          <View style={styles.yAxis}>
            <Text variant="labelSmall" style={styles.yAxisLabel}>100%</Text>
            <Text variant="labelSmall" style={styles.yAxisLabel}>50%</Text>
            <Text variant="labelSmall" style={styles.yAxisLabel}>0%</Text>
          </View>
          <View style={styles.chart}>
            <Svg height={height} width={chartWidth}>
              {/* Gradient definitions */}
              <Defs>
                <LinearGradient id="fatigueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={colors.fatigueCritical} stopOpacity={0.8} />
                  <Stop offset="30%" stopColor={colors.fatigueHigh} stopOpacity={0.6} />
                  <Stop offset="60%" stopColor={colors.fatigueModerate} stopOpacity={0.4} />
                  <Stop offset="100%" stopColor={colors.fatigueLow} stopOpacity={0.2} />
                </LinearGradient>
              </Defs>

              {/* Background grid lines */}
              <Line
                x1={padding}
                y1={padding + chartHeight * 0.25}
                x2={chartWidth - padding}
                y2={padding + chartHeight * 0.25}
                stroke={colors.lightGray}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <Line
                x1={padding}
                y1={padding + chartHeight * 0.5}
                x2={chartWidth - padding}
                y2={padding + chartHeight * 0.5}
                stroke={colors.lightGray}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <Line
                x1={padding}
                y1={padding + chartHeight * 0.75}
                x2={chartWidth - padding}
                y2={padding + chartHeight * 0.75}
                stroke={colors.lightGray}
                strokeWidth="1"
                strokeDasharray="4,4"
              />

              {/* Area fill */}
              {areaD && (
                <Path
                  d={areaD}
                  fill="url(#fatigueGradient)"
                  opacity="0.5"
                />
              )}

              {/* Line */}
              {points.length > 1 && (
                <Path
                  d={pathD}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {points.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={point.color}
                  stroke={colors.white}
                  strokeWidth="2"
                />
              ))}
            </Svg>
          </View>
        </View>
        <View style={styles.xAxis}>
          <Text variant="labelSmall" style={styles.xAxisLabel}>
            {displayHistory[0]?.timestamp
              ? new Date(displayHistory[0].timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </Text>
          <Text variant="labelSmall" style={styles.xAxisLabel}>
            {displayHistory[displayHistory.length - 1]?.timestamp
              ? new Date(displayHistory[displayHistory.length - 1].timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  title: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.gray,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: spacing.xs,
    height: '100%',
  },
  yAxisLabel: {
    color: colors.gray,
  },
  chart: {
    flex: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  xAxisLabel: {
    color: colors.gray,
  },
});
