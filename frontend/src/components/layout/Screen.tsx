import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
  /** Use the elevated surface as background (for hero / focused screens) */
  surface?: 'default' | 'elevated' | 'sunken';
  /** Show a subtle radial atmosphere glow at the top — for hero screens */
  glow?: boolean;
}

export default function Screen({
  children,
  style,
  contentContainerStyle,
  scrollable = false,
  refreshing = false,
  onRefresh,
  edges = { top: false, bottom: true, left: false, right: false },
  surface = 'default',
  glow = false,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const backgroundColor =
    surface === 'elevated'
      ? colors.surfaceElevated
      : surface === 'sunken'
      ? colors.surfaceSunken
      : colors.surface;

  const containerStyle: ViewStyle[] = [
    styles.container,
    { backgroundColor },
    {
      paddingTop: edges.top ? insets.top : 0,
      paddingBottom: edges.bottom ? insets.bottom : 0,
      paddingLeft: edges.left ? insets.left : 0,
      paddingRight: edges.right ? insets.right : 0,
    },
    ...(style ? [style] : []),
  ];

  const body = (
    <>
      {glow && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colors.accent,
              opacity: 0.05,
              transform: [{ scaleY: 0.5 }, { translateY: -180 }],
              borderBottomLeftRadius: 400,
              borderBottomRightRadius: 400,
            },
          ]}
        />
      )}
      {children}
    </>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          ) : undefined
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>
    );
  }

  return <View style={containerStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
