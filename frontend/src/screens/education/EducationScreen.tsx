import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import FadeSlideIn from '@/components/ui/FadeSlideIn';
import Screen from '@/components/layout/Screen';
import Card from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { EDUCATION_CARDS, EducationCard } from '@/content/education';

export default function EducationScreen() {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Screen
      scrollable
      edges={{ top: true, bottom: true }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.md,
      }}
    >
      {/* Header */}
      <FadeSlideIn duration={360}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            marginBottom: spacing.md,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ChevronLeft size={18} color={colors.inkMuted} strokeWidth={2} />
          <Text style={{ ...typeScale.bodyMd, color: colors.inkMuted, marginLeft: 4 }}>Réglages</Text>
        </Pressable>
        <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>Santé & sécurité</Text>
        <Text style={{
          fontFamily: fonts.displayItalic,
          fontSize: 34,
          lineHeight: 42,
          color: colors.ink,
          marginTop: 4,
          letterSpacing: -0.4,
        }}>
          Fiches éducatives
        </Text>
        <Text style={{ ...typeScale.bodyMd, color: colors.inkMuted, marginTop: spacing.xs }}>
          6 fiches courtes pour mieux comprendre la fatigue au volant.
        </Text>
      </FadeSlideIn>

      {/* Cards */}
      {EDUCATION_CARDS.map((card, index) => (
        <FadeSlideIn key={card.id} fromY={8} duration={360} delay={index * 40}>
          <Pressable onPress={() => setExpanded(expanded === card.id ? null : card.id)}>
            <Card noPadding style={{ overflow: 'hidden' }}>
              {/* Header row */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: spacing.md,
                gap: spacing.md,
              }}>
                <Text style={{ fontSize: 28 }}>{card.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typeScale.bodyMd, color: colors.ink, fontFamily: fonts.bodySemibold }}>
                    {card.title}
                  </Text>
                </View>
                {expanded === card.id
                  ? <ChevronUp size={16} color={colors.inkSubtle} strokeWidth={2} />
                  : <ChevronDown size={16} color={colors.inkSubtle} strokeWidth={2} />
                }
              </View>

              {/* Expanded content */}
              {expanded === card.id && (
                <View style={{
                  paddingHorizontal: spacing.md,
                  paddingBottom: spacing.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.hairline,
                }}>
                  <Text style={{ ...typeScale.bodyMd, color: colors.inkSubtle, marginTop: spacing.sm, lineHeight: 22 }}>
                    {card.body}
                  </Text>
                  <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
                    {card.tips.map((tip, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                        <View style={{
                          width: 6, height: 6, borderRadius: 3,
                          backgroundColor: colors.accent,
                          marginTop: 7,
                          flexShrink: 0,
                        }} />
                        <Text style={{ ...typeScale.bodySm, color: colors.inkMuted, flex: 1, lineHeight: 20 }}>
                          {tip}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          </Pressable>
        </FadeSlideIn>
      ))}
    </Screen>
  );
}
