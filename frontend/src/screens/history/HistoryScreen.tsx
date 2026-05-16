import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '@/store';
import { shiftsApi } from '@/services';
import ShiftCard from '@/components/shift/ShiftCard';
import Screen from '@/components/layout/Screen';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonStack } from '@/components/ui/Skeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { ShiftListItem } from '@/types/api';
import { RootStackParamList } from '@/types/navigation';

type HistoryScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;
type FilterStatus = 'all' | 'active' | 'completed';

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'completed', label: 'Terminés' },
  { value: 'active', label: 'En cours' },
];

export default function HistoryScreen() {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const { driver } = useAuthStore();

  const [shifts, setShifts] = useState<ShiftListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const loadShifts = useCallback(
    async (refresh = false) => {
      if (!driver) return;
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {
          driver_id: driver.id,
          page: refresh ? 1 : page,
          per_page: 20,
        };
        if (filter !== 'all') params.status = filter;
        const response = await shiftsApi.listShifts(params);
        if (refresh) setShifts(response.shifts);
        else setShifts((prev) => [...prev, ...response.shifts]);
        setTotal(response.total);
        setPage(response.page);
      } catch (err) {
        // silent — handled by global toast in caller patterns
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        setIsFirstLoad(false);
      }
    },
    [driver, page, filter]
  );

  useFocusEffect(
    useCallback(() => {
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

  return (
    <Screen edges={{ top: true, bottom: true }}>
      {/* Hero header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>
          Vos archives
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
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
            Historique
          </Text>
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              color: colors.inkMuted,
              marginBottom: 6,
            }}
          >
            {total} {total > 1 ? 'trajets' : 'trajet'}
          </Text>
        </View>

        {/* Filter pills */}
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            marginTop: spacing.lg,
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 6,
                  borderRadius: borderRadius.round,
                  backgroundColor: active
                    ? colors.ink
                    : colors.surfaceElevated,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: active ? colors.ink : colors.hairlineStrong,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: 12,
                    letterSpacing: 0.4,
                    color: active ? colors.inkInverse : colors.ink,
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Body */}
      {isFirstLoad && shifts.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <SkeletonStack rows={4} rowHeight={90} gap={12} />
        </View>
      ) : shifts.length === 0 ? (
        <EmptyState
          illustration
          title="Aucun trajet"
          message={
            filter === 'all'
              ? "Démarrez votre premier trajet pour voir l'historique apparaître ici."
              : `Aucun trajet ${filter === 'completed' ? 'terminé' : 'actif'} pour le moment.`
          }
        />
      ) : (
        <FlatList
          data={shifts}
          renderItem={renderShift}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.sm,
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
