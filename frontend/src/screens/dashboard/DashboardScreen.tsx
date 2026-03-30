import React from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore, useShiftStore } from '@/store';
import { shiftsApi } from '@/services';
import Screen from '@/components/layout/Screen';
import { colors, spacing, borderRadius, shadows } from '@/utils/theme';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { ShiftListItem } from '@/types/api';
import { MainTabsParamList } from '@/types/navigation';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainTabsParamList>>();
  const { driver } = useAuthStore();
  const { activeShift, setActiveShift } = useShiftStore();
  const [stats, setStats] = React.useState<{
    total_shifts: number;
    total_driving_hours: number;
  } | null>(null);
  const [recentShifts, setRecentShifts] = React.useState<ShiftListItem[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadData = async () => {
    if (!driver) return;
    
    setIsLoading(true);
    try {
      const statsData = await shiftsApi.getDriverStats(driver.id);
      setStats({
        total_shifts: statsData.total_shifts,
        total_driving_hours: statsData.total_driving_hours,
      });

      const shiftsData = await shiftsApi.listShifts({
        driver_id: driver.id,
        page: 1,
        per_page: 3,
      });
      setRecentShifts(shiftsData.shifts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [driver])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStartShift = async () => {
    if (!driver) return;

    try {
      const shift = await shiftsApi.startShift(driver.id);
      setActiveShift(shift);
      console.log('Shift started:', shift);
      navigation.navigate('ActiveShift');
    } catch (error) {
      console.error('Error starting shift:', error);
    }
  };

  const handleContinueShift = () => {
    if (activeShift) {
      navigation.navigate('ActiveShift');
    }
  };

  return (
    <Screen
      scrollable
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      edges={{ top: true, bottom: true }}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.greeting}>
          Bonjour, {driver?.username || 'Conducteur'}!
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Prêt pour la route ?
        </Text>
      </View>

      {activeShift ? (
        <Card style={[styles.card, styles.activeShiftCard]} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.activeShiftTitle}>
              Trajet en cours
            </Text>
            <Text variant="bodyMedium" style={styles.activeShiftTime}>
              Débuté à {formatDateTime(activeShift.started_at)}
            </Text>
            <Button
              mode="contained"
              style={styles.continueButton}
              onPress={handleContinueShift}
            >
              Voir le trajet
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Card style={[styles.card, styles.startShiftCard]} mode="elevated">
          <Card.Content style={styles.startShiftContent}>
            <Text variant="titleLarge" style={styles.startShiftTitle}>
              Commencer un nouveau trajet
            </Text>
            <Text variant="bodyMedium" style={styles.startShiftDescription}>
              Démarrez votre session de conduite pour commencer le suivi de fatigue
            </Text>
            <Button
              mode="contained"
              style={styles.startButton}
              onPress={handleStartShift}
              loading={isLoading}
              disabled={isLoading}
            >
              Démarrer le trajet
            </Button>
          </Card.Content>
        </Card>
      )}

      {stats && (
        <View style={styles.statsContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Vos statistiques
          </Text>
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, styles.greenCard]} mode="elevated">
              <Card.Content style={styles.statCardContent}>
                <Text variant="displaySmall" style={styles.statValue}>
                  {stats.total_shifts}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Trajets
                </Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, styles.blueCard]} mode="elevated">
              <Card.Content style={styles.statCardContent}>
                <Text variant="displaySmall" style={styles.statValue}>
                  {formatDuration(stats.total_driving_hours)}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Temps de conduite
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      )}

      {recentShifts.length > 0 && (
        <View style={styles.recentShiftsContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Trajets récents
          </Text>
          {recentShifts.map((shift) => (
            <Card key={shift.id} style={styles.shiftCard} mode="outlined">
              <Card.Content>
                <Text variant="bodySmall" style={styles.shiftDate}>
                  {formatDateTime(shift.started_at)}
                </Text>
                <Text variant="bodyMedium">
                  Durée: {formatDuration(shift.duration_h ?? 0)}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  subtitle: {
    color: colors.gray,
  },
  card: {
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  activeShiftCard: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  activeShiftTitle: {
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  activeShiftTime: {
    color: colors.gray,
    marginBottom: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.primary,
  },
  startShiftCard: {
    backgroundColor: colors.white,
  },
  startShiftContent: {
    alignItems: 'center',
  },
  startShiftTitle: {
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  startShiftDescription: {
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
  },
  statsContainer: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  greenCard: {
    backgroundColor: colors.fatigueLow,
  },
  blueCard: {
    backgroundColor: colors.primaryLight,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontWeight: 'bold',
    color: colors.white,
  },
  statLabel: {
    color: colors.white,
    opacity: 0.9,
  },
  recentShiftsContainer: {
    gap: spacing.sm,
  },
  shiftCard: {
    borderRadius: borderRadius.md,
  },
  shiftDate: {
    color: colors.gray,
    marginBottom: spacing.xs,
  },
});
