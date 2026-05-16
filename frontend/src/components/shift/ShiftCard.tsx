import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ShiftListItem, FatigueLevel } from '@/types/api';
import { useTheme } from '@/contexts/ThemeContext';
import {
  formatDateTime,
  formatDuration,
  getFatigueColor,
  getFatigueLabel,
} from '@/utils/formatters';

interface ShiftCardProps {
  shift: ShiftListItem;
  onPress?: () => void;
  showNavigation?: boolean;
}

export default function ShiftCard({
  shift,
  onPress,
  showNavigation = true,
}: ShiftCardProps) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();

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

  const cardBody = (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.hairline,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
      }}
    >
      {/* Top row: date + status pill */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={{
            ...typeScale.bodyMd,
            color: colors.ink,
            fontFamily: fonts.bodyMedium,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {formatDateTime(shift.started_at)}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
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
      </View>

      {/* Bottom row: three stats */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.md,
        }}
      >
        <Stat
          label="Durée"
          value={formatDuration(shift.duration_h ?? 0)}
          mono
        />
        <Stat
          label="Fatigue max"
          value={
            shift.max_fatigue_score
              ? `${Math.round(shift.max_fatigue_score * 100)}%`
              : '—'
          }
          color={fatigueColor}
          mono
        />
        <Stat
          label="Statut"
          value={isCompleted ? 'Terminé' : 'En cours'}
          color={isCompleted ? colors.inkMuted : colors.fatigueWatch}
        />
      </View>
    </View>
  );

  if (!showNavigation || !onPress) {
    return cardBody;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {cardBody}
    </Pressable>
  );
}

function Stat({
  label,
  value,
  color,
  mono,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}) {
  const { colors, fonts, typeScale } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: mono ? fonts.mono : fonts.bodySemibold,
          fontSize: 14,
          lineHeight: 20,
          color: color ?? colors.ink,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
