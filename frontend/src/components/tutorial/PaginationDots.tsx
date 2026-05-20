import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PaginationDotsProps {
  count: number;
  active: number;
  onPress?: (index: number) => void;
}

export default function PaginationDots({ count, active, onPress }: PaginationDotsProps) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs + 2,
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <Pressable
            key={i}
            onPress={() => onPress?.(i)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Aller à la carte ${i + 1}`}
            accessibilityState={{ selected: isActive }}
            style={{
              width: isActive ? 22 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isActive ? colors.accent : colors.hairlineStrong,
            }}
          />
        );
      })}
    </View>
  );
}
