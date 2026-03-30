import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Chip, SegmentedButtons } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '@/store';
import { shiftsApi } from '@/services';
import ShiftCard from '@/components/shift/ShiftCard';
import Screen from '@/components/layout/Screen';
import EmptyState from '@/components/ui/EmptyState';
import { colors, spacing } from '@/utils/theme';
import { ShiftListItem } from '@/types/api';
import { RootStackParamList } from '@/types/navigation';

type HistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterStatus = 'all' | 'active' | 'completed';

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const { driver } = useAuthStore();
  const [shifts, setShifts] = React.useState<ShiftListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterStatus>('all');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadShifts = async (refresh = false) => {
    if (!driver) return;

    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        driver_id: driver.id,
        page: refresh ? 1 : page,
        per_page: 20,
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await shiftsApi.listShifts(params);

      if (refresh) {
        setShifts(response.shifts);
      } else {
        setShifts((prev) => [...prev, ...response.shifts]);
      }

      setTotal(response.total);
      setPage(response.page);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadShifts(true);
    }, [driver, filter])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadShifts(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && shifts.length < total) {
      setPage((prev) => prev + 1);
      loadShifts();
    }
  };

  const handleShiftPress = (shiftId: number) => {
    navigation.navigate('ShiftDetail', { shiftId: String(shiftId) });
  };

  const renderShift = ({ item }: { item: ShiftListItem }) => (
    <ShiftCard shift={item} onPress={() => handleShiftPress(item.id)} />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="history"
      title="Aucun trajet"
      message={
        filter === 'all'
          ? "Commencez votre premier trajet pour voir l'historique"
          : `Aucun trajet ${filter} trouvé`
      }
    />
  );

  return (
    <Screen style={styles.container} edges={{ top: true, bottom: true }}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Historique des trajets
        </Text>

        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={filter}
            onValueChange={(value: string) => setFilter(value as FilterStatus)}
            buttons={[
              {
                value: 'all',
                label: 'Tous',
              },
              {
                value: 'completed',
                label: 'Terminés',
              },
              {
                value: 'active',
                label: 'En cours',
              },
            ]}
            style={styles.filterButtons}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text variant="bodySmall" style={styles.statBadgeLabel}>Total</Text>
            <Text variant="titleMedium" style={styles.statBadgeValue}>{total}</Text>
          </View>
        </View>
      </View>

      {shifts.length === 0 && !isLoading ? (
        renderEmpty()
      ) : (
        <FlatList
          data={shifts}
          renderItem={renderShift}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={
            isLoading && shifts.length > 0 ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  title: {
    fontWeight: 'bold',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  filterButtons: {
    height: 36,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  statBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
  },
  statBadgeLabel: {
    color: colors.primaryDark,
    fontWeight: '500',
  },
  statBadgeValue: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  loader: {
    marginVertical: spacing.lg,
  },
});
