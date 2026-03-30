import React from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { useShiftStore, useFatigueStore } from '@/store';
import { shiftsApi } from '@/services';
import { useShift } from '@/hooks/useShift';
import FatigueGauge from '@/components/fatigue/FatigueGauge';
import Screen from '@/components/layout/Screen';
import { colors, spacing, borderRadius } from '@/utils/theme';
import {
  getFatigueColor,
  getFatigueLabel,
  getFatigueMessage,
  formatMinutes,
  getMinutesDifference,
} from '@/utils/formatters';

export default function ActiveShiftScreen() {
  const { activeShift, clearActiveShift, shiftStatus, setShiftStatus } = useShiftStore();
  const {
    currentFatigueLevel,
    currentFatigueScore,
    suggestion,
    updateFatigue,
    clearFatigueData,
  } = useFatigueStore();

  // GPS tracking hook - sends snapshots every 30 seconds
  const {
    isTracking,
    isSending,
    snapshotCount,
    lastSnapshotTime,
    location,
    error: locationError,
  } = useShift({
    snapshotInterval: 30000, // 30 seconds
    enableBackgroundTracking: true,
  });

  const [timeSinceStart, setTimeSinceStart] = React.useState(0);
  const [isEnding, setIsEnding] = React.useState(false);

  // Update timer every second
  React.useEffect(() => {
    if (!activeShift) return;

    const interval = setInterval(() => {
      setTimeSinceStart(getMinutesDifference(activeShift.started_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift]);

  const handleEndShift = async () => {
    if (!activeShift) return;

    Alert.alert(
      'Terminer le trajet',
      'Êtes-vous sûr de vouloir terminer ce trajet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            setIsEnding(true);
            try {
              const result = await shiftsApi.endShift(String(activeShift.shift_id));
              console.log('Shift ended:', result);
              clearActiveShift();
              clearFatigueData();
            } catch (error) {
              console.error('Error ending shift:', error);
              Alert.alert('Erreur', "Impossible de terminer le trajet");
            } finally {
              setIsEnding(false);
            }
          },
        },
      ]
    );
  };

  const fatigueColor = getFatigueColor(currentFatigueLevel);
  const fatigueScore = currentFatigueScore ?? 0;

  return (
    <Screen
      style={styles.container}
      edges={{ top: false, bottom: true }}
      scrollable={true}
      contentContainerStyle={styles.screenContent}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="titleLarge" style={styles.title}>
            Trajet en cours
          </Text>
          <Text variant="bodyLarge" style={styles.timer}>
            {formatMinutes(timeSinceStart)}
          </Text>
        </View>
      </View>

      {/* Fatigue Gauge */}
      <FatigueGauge
        fatigueLevel={currentFatigueLevel}
        fatigueScore={currentFatigueScore}
        size="large"
        showLabel={true}
        showMessage={true}
      />

      {/* Suggestion Card */}
      {suggestion && (
        <Card style={[styles.suggestionCard]} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.suggestionTitle}>
              💡 Suggestion
            </Text>
            <Text variant="bodyMedium">{suggestion.message}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Snapshots
            </Text>
            <Text variant="titleMedium">
              {snapshotCount}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              GPS
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isTracking ? colors.success : colors.gray },
                ]}
              />
              <Text variant="bodyMedium">
                {isTracking ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>
        </View>
        {lastSnapshotTime && (
          <Text variant="bodySmall" style={styles.lastSnapshot}>
            Dernier snapshot: {lastSnapshotTime.toLocaleTimeString('fr-FR')}
          </Text>
        )}
        {locationError && (
          <Text variant="bodySmall" style={styles.errorText}>
            ⚠️ GPS: {typeof locationError === 'string' ? locationError : locationError?.message || 'Erreur GPS'}
          </Text>
        )}
      </View>

      {/* End Shift Button */}
      <Button
        mode="contained"
        onPress={handleEndShift}
        style={styles.endButton}
        buttonColor={colors.error}
        disabled={isEnding}
        loading={isEnding}
      >
        {isEnding ? 'Fin en cours...' : 'Terminer le trajet'}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  timer: {
    fontWeight: '600',
    fontSize: 32,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  suggestionCard: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  suggestionTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.primaryDark,
  },
  statsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: colors.gray,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lastSnapshot: {
    textAlign: 'center',
    color: colors.gray,
    marginTop: spacing.sm,
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
    marginTop: spacing.sm,
  },
  endButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
});
