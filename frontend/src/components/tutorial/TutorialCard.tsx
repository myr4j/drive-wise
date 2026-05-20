import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TutorialCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export default function TutorialCard({ icon, title, children }: TutorialCardProps) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const { width } = useWindowDimensions();

  return (
    <View
      style={{
        width,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.accent + '18',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.sm,
        }}
      >
        {icon}
      </View>

      <Text
        style={{
          fontFamily: fonts.displayItalic,
          fontSize: 26,
          lineHeight: 32,
          color: colors.ink,
          marginTop: spacing.lg,
          textAlign: 'center',
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>

      <View style={{ marginTop: spacing.md, alignItems: 'center', width: '100%' }}>
        {typeof children === 'string' ? (
          <Text
            style={{
              ...typeScale.bodyMd,
              color: colors.inkMuted,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
