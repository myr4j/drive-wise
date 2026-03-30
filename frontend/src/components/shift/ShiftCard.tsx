import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';

import { ShiftListItem, FatigueLevel } from '@/types/api';
import { colors, spacing, borderRadius, shadows } from '@/utils/theme';
import { formatDateTime, formatDuration, getFatigueColor, getFatigueLabel } from '@/utils/formatters';

interface ShiftCardProps {
  shift: ShiftListItem;
  onPress?: () => void;
  showNavigation?: boolean;
}

export default function ShiftCard({ shift, onPress, showNavigation = true }: ShiftCardProps) {
  // Convert score to fatigue level
  const score = shift.avg_fatigue_score ?? 0;
  const fatigueLevel: FatigueLevel = score < 0.3 ? FatigueLevel.LOW : score < 0.6 ? FatigueLevel.MODERATE : score < 0.8 ? FatigueLevel.HIGH : FatigueLevel.CRITICAL;
  const fatigueColor = getFatigueColor(fatigueLevel);

  const handlePress = () => {
    if (showNavigation && onPress) {
      onPress();
    }
  };

  return (
    <Card
      style={[styles.card, shadows.sm]}
      mode="outlined"
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} disabled={!showNavigation}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.dateContainer}>
              <Text variant="titleMedium" style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {formatDateTime(shift.started_at)}
              </Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: shift.status === 'completed' ? colors.success : colors.warning },
                ]}
              />
            </View>
            <Chip
              mode="flat"
              style={[styles.fatigueChip, { backgroundColor: fatigueColor + '20' }]}
              textStyle={styles.fatigueChipText}
              selectedColor={fatigueColor}
            >
              {getFatigueLabel(fatigueLevel)}
            </Chip>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Durée
              </Text>
              <Text variant="bodyMedium" style={styles.statValue}>
                {formatDuration(shift.duration_h ?? 0)}
              </Text>
            </View>
            <View style={[styles.statItem, styles.fatigueStatItem]}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Fatigue max
              </Text>
              <View style={[styles.fatigueBadge, { backgroundColor: fatigueColor + '20' }]}>
                <Text variant="bodyMedium" style={[styles.fatigueBadgeText, { color: fatigueColor }]}>
                  {shift.max_fatigue_score ? Math.round(shift.max_fatigue_score * 100) + '%' : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Statut
              </Text>
              <Text variant="bodyMedium" style={styles.statValue}>
                {shift.status === 'completed' ? 'Terminé' : 'En cours'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.white,
  },
  content: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
    flexShrink: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  fatigueChip: {
    height: 24,
    flexShrink: 0,
  },
  fatigueChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.darkGray,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  fatigueStatItem: {
    paddingHorizontal: spacing.xs,
  },
  fatigueBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: 2,
  },
  fatigueBadgeText: {
    fontWeight: '600',
    fontSize: 13,
  },
  statLabel: {
    color: colors.gray,
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '500',
  },
});
