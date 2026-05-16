import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import {
  Svg,
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { FatigueHistoryPoint } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import { getFatigueColor } from '@/utils/formatters';
import Card from '@/components/ui/Card';

interface FatigueHistoryChartProps {
  history: FatigueHistoryPoint[];
  height?: number;
}

export default function FatigueHistoryChart({
  history,
  height = 150,
}: FatigueHistoryChartProps) {
  const { colors, fonts, spacing, typeScale } = useTheme();

  if (history.length === 0) {
    return (
      <Card variant="outlined">
        <Text
          style={{
            ...typeScale.bodyMd,
            color: colors.inkMuted,
            textAlign: 'center',
            paddingVertical: spacing.md,
          }}
        >
          Aucune donnée de fatigue disponible
        </Text>
      </Card>
    );
  }

  const maxPoints = 20;
  const displayHistory = history.slice(-maxPoints);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 2 - spacing.md * 2 - 30;
  const padding = 24;
  const chartHeight = height - padding * 2;
  const maxScore = Math.max(...displayHistory.map((p) => p.fatigueScore), 1);

  const points = displayHistory.map((point, index) => {
    const x =
      padding +
      (index / (displayHistory.length - 1 || 1)) *
        (chartWidth - padding * 2);
    const y =
      height - padding - (point.fatigueScore / maxScore) * chartHeight;
    return {
      x,
      y,
      color: getFatigueColor(point.fatigueLevel),
    };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const areaD =
    points.length > 1
      ? `${pathD} L ${padding + (chartWidth - padding * 2)} ${
          height - padding
        } L ${padding} ${height - padding} Z`
      : '';

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', height }}>
        {/* Y-axis labels */}
        <View
          style={{
            justifyContent: 'space-between',
            paddingRight: 6,
            paddingVertical: padding,
          }}
        >
          {['100', '50', '0'].map((tick) => (
            <Text
              key={tick}
              style={{
                fontFamily: fonts.mono,
                fontSize: 9,
                color: colors.inkSubtle,
              }}
            >
              {tick}%
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          <Svg height={height} width={chartWidth}>
            <Defs>
              <LinearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.18} />
                <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Grid */}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <Line
                key={ratio}
                x1={padding}
                y1={padding + chartHeight * ratio}
                x2={chartWidth - padding}
                y2={padding + chartHeight * ratio}
                stroke={colors.hairline}
                strokeWidth="1"
                strokeDasharray="2,4"
              />
            ))}

            {/* Area */}
            {areaD ? <Path d={areaD} fill="url(#histFill)" /> : null}

            {/* Line */}
            {points.length > 1 ? (
              <Path
                d={pathD}
                fill="none"
                stroke={colors.accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Points */}
            {points.map((p, i) => (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={colors.surfaceElevated}
                stroke={p.color}
                strokeWidth="2"
              />
            ))}
          </Svg>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: colors.inkMuted,
          }}
        >
          {displayHistory[0]?.timestamp
            ? new Date(displayHistory[0].timestamp).toLocaleTimeString(
                'fr-FR',
                { hour: '2-digit', minute: '2-digit' }
              )
            : ''}
        </Text>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: colors.inkMuted,
          }}
        >
          {displayHistory[displayHistory.length - 1]?.timestamp
            ? new Date(
                displayHistory[displayHistory.length - 1].timestamp
              ).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Text>
      </View>
    </Card>
  );
}
