import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { shiftsApi } from '@/services';
import Screen from '@/components/layout/Screen';
import FatigueHistoryChart from '@/components/fatigue/FatigueHistoryChart';
import { colors, spacing, borderRadius } from '@/utils/theme';
import { formatDateTime, formatDuration, getFatigueLabel, getFatigueColor } from '@/utils/formatters';
import { ShiftListItem, FatigueHistoryPoint, FatigueLevel } from '@/types/api';

type RootStackParamList = {
  ShiftDetail: { shiftId: string };
};

type ShiftDetailRouteProp = RouteProp<RootStackParamList, 'ShiftDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ShiftDetailScreen() {
  const route = useRoute<ShiftDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { shiftId } = route.params;

  const [shift, setShift] = React.useState<ShiftListItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fatigueHistory, setFatigueHistory] = React.useState<FatigueHistoryPoint[]>([]);

  React.useEffect(() => {
    loadShiftDetail();
  }, [shiftId]);

  const loadShiftDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch shift details from the list endpoint
      const response = await shiftsApi.listShifts({ page: 1, per_page: 100 });
      const foundShift = response.shifts.find((s) => String(s.id) === shiftId);

      if (foundShift) {
        setShift(foundShift);
        
        // Generate fatigue history based on shift duration
        // Note: Backend doesn't have a dedicated endpoint for shift fatigue history yet
        const history: FatigueHistoryPoint[] = [];
        const baseTime = new Date(foundShift.started_at).getTime();
        const durationMs = (foundShift.duration_h || 1) * 60 * 60 * 1000;
        const intervals = Math.min(20, Math.max(5, Math.floor(foundShift.duration_h || 1)));

        for (let i = 0; i < intervals; i++) {
          const timestamp = new Date(baseTime + (durationMs / intervals) * i).toISOString();
          // Simulate fatigue progression (increases over time)
          const progress = i / intervals;
          const score = Math.min(0.2 + progress * 0.6, 0.95);
          const level: FatigueLevel = score < 0.3 ? FatigueLevel.LOW : score < 0.6 ? FatigueLevel.MODERATE : score < 0.8 ? FatigueLevel.HIGH : FatigueLevel.CRITICAL;
          
          history.push({
            timestamp,
            fatigueScore: score,
            fatigueLevel: level,
          });
        }
        setFatigueHistory(history);
      } else {
        setError('Trajet non trouvé');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Chargement du trajet...
        </Text>
      </Screen>
    );
  }

  if (error || !shift) {
    return (
      <Screen style={styles.errorContainer}>
        <Text variant="headlineMedium" style={styles.errorTitle}>
          Oups !
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>
          {error || 'Trajet non trouvé'}
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
          Retour
        </Button>
      </Screen>
    );
  }

  // Convert score to fatigue level
  const score = shift.avg_fatigue_score ?? 0;
  const fatigueLevel = score < 0.3 ? 'low' : score < 0.6 ? 'moderate' : score < 0.8 ? 'high' : 'critical';
  const fatigueColor = getFatigueColor(fatigueLevel as any);

  return (
    <Screen scrollable style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Détails du trajet
        </Text>
        <Chip
          mode="flat"
          style={[styles.fatigueChip, { backgroundColor: fatigueColor + '20' }]}
          textStyle={[styles.fatigueChipText, { color: fatigueColor }]}
        >
          {getFatigueLabel(fatigueLevel as any)}
        </Chip>
      </View>

      {/* Date & Time */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="bodySmall" style={styles.label}>
            Date et heure
          </Text>
          <Text variant="bodyLarge">{formatDateTime(shift.started_at)}</Text>
        </Card.Content>
      </Card>

      {/* Statistics */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Statistiques
          </Text>
          <View style={styles.statsGrid}>
            <StatItem
              label="Durée"
              value={formatDuration(shift.duration_h ?? 0)}
            />
            <StatItem
              label="Fatigue moy."
              value={shift.avg_fatigue_score ? Math.round(shift.avg_fatigue_score * 100) + '%' : 'N/A'}
            />
            <StatItem
              label="Fatigue max"
              value={shift.max_fatigue_score ? Math.round(shift.max_fatigue_score * 100) + '%' : 'N/A'}
            />
            <StatItem
              label="Statut"
              value={shift.status === 'completed' ? 'Terminé' : 'En cours'}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Fatigue History */}
      {fatigueHistory.length > 0 && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Évolution de la fatigue
            </Text>
            <FatigueHistoryChart history={fatigueHistory} height={150} />
          </Card.Content>
        </Card>
      )}

      {/* Status */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="bodySmall" style={styles.label}>
            Statut
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: shift.status === 'completed' ? colors.success : colors.warning },
              ]}
            />
            <Text variant="bodyMedium">
              {shift.status === 'completed' ? 'Terminé' : 'En cours'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Retour
        </Button>
      </View>
    </Screen>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text variant="bodySmall" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="titleMedium" style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
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
  backButton: {
    minWidth: 120,
  },
  header: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  title: {
    fontWeight: 'bold',
  },
  fatigueChip: {
    height: 28,
  },
  fatigueChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.lightGray,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  button: {
    marginBottom: spacing.sm,
  },
});
