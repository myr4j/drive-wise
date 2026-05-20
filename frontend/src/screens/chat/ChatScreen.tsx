import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Send, Sparkles, RotateCcw } from 'lucide-react-native';

import Screen from '@/components/layout/Screen';
import FadeSlideIn from '@/components/ui/FadeSlideIn';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatStore } from '@/store';
import type { ChatMessage } from '@/types/api';

const SUGGESTIONS: string[] = [
  'Pourquoi mon score de fatigue était élevé hier ?',
  'Comment mieux répartir mes pauses ?',
  'Quels sont les bons réflexes avant un long trajet ?',
  'Quel est mon score moyen récent ?',
];

export default function ChatScreen() {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const { messages, isLoading, error, sendUserMessage, clearConversation, clearError } =
    useChatStore();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Scroll auto vers le bas quand un message arrive ou pendant le typing
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length, isLoading]);

  const handleSend = () => {
    const value = draft.trim();
    if (!value || isLoading) return;
    setDraft('');
    sendUserMessage(value);
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    sendUserMessage(text);
  };

  const canSend = draft.trim().length > 0 && !isLoading;

  return (
    <Screen edges={{ top: true, bottom: false }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <FadeSlideIn duration={360} style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>DriveSafe</Text>
              <Text
                style={{
                  fontFamily: fonts.displayItalic,
                  fontSize: 28,
                  lineHeight: 34,
                  color: colors.ink,
                  letterSpacing: -0.4,
                  marginTop: 2,
                }}
              >
                Pose ta question
              </Text>
            </View>
            {messages.length > 0 && (
              <Pressable
                onPress={clearConversation}
                hitSlop={12}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  padding: spacing.xs,
                  opacity: pressed ? 0.6 : 1,
                })}
                accessibilityLabel="Nouvelle conversation"
              >
                <RotateCcw size={14} color={colors.inkMuted} strokeWidth={2} />
                <Text style={{ ...typeScale.bodySm, color: colors.inkMuted }}>Nouvelle session</Text>
              </Pressable>
            )}
          </View>
        </FadeSlideIn>

        {/* Conversation */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
            gap: spacing.sm,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <EmptyState
              colors={colors}
              fonts={fonts}
              spacing={spacing}
              typeScale={typeScale}
              borderRadius={borderRadius}
              suggestions={SUGGESTIONS}
              onPick={handleSuggestion}
            />
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  colors={colors}
                  fonts={fonts}
                  spacing={spacing}
                  typeScale={typeScale}
                  borderRadius={borderRadius}
                />
              ))}
              {isLoading && (
                <TypingIndicator
                  colors={colors}
                  spacing={spacing}
                  borderRadius={borderRadius}
                />
              )}
              {error && (
                <Pressable
                  onPress={clearError}
                  style={{
                    alignSelf: 'center',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    marginTop: spacing.xs,
                  }}
                >
                  <Text style={{ ...typeScale.bodySm, color: colors.error, textAlign: 'center' }}>
                    {error} — appuie pour réessayer
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>

        {/* Composer */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.hairline,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surfaceElevated,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.hairline,
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Écris ta question…"
              placeholderTextColor={colors.inkSubtle}
              multiline
              maxLength={2000}
              selectionColor={colors.accent}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              style={{
                fontFamily: fonts.body,
                fontSize: 15,
                lineHeight: 22,
                color: colors.ink,
                maxHeight: 120,
                paddingVertical: 2,
                paddingHorizontal: 0,
              }}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: borderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSend ? colors.accent : colors.surfaceSunken,
              opacity: pressed && canSend ? 0.85 : 1,
            })}
            accessibilityLabel="Envoyer le message"
          >
            <Send
              size={18}
              color={canSend ? colors.onAccent : colors.inkSubtle}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// --- Sous-composants -------------------------------------------------------

interface BubbleStyleProps {
  colors: ReturnType<typeof useTheme>['colors'];
  fonts: ReturnType<typeof useTheme>['fonts'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  typeScale: ReturnType<typeof useTheme>['typeScale'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function MessageBubble({
  message,
  colors,
  fonts,
  spacing,
  typeScale,
  borderRadius,
}: BubbleStyleProps & { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <FadeSlideIn fromY={6} duration={280}>
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          backgroundColor: isUser ? colors.accent : colors.surfaceElevated,
          borderRadius: borderRadius.lg,
          borderBottomRightRadius: isUser ? 6 : borderRadius.lg,
          borderBottomLeftRadius: isUser ? borderRadius.lg : 6,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.hairline,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 22,
            color: isUser ? colors.onAccent : colors.ink,
          }}
        >
          {message.content}
        </Text>
      </View>
    </FadeSlideIn>
  );
}

function TypingIndicator({
  colors,
  spacing,
  borderRadius,
}: Pick<BubbleStyleProps, 'colors' | 'spacing' | 'borderRadius'>) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    const a = pulse(dot1, 0);
    const b = pulse(dot2, 150);
    const c = pulse(dot3, 300);
    a.start(); b.start(); c.start();
    return () => { a.stop(); b.stop(); c.stop(); };
  }, []);

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors.surfaceElevated,
        borderRadius: borderRadius.lg,
        borderBottomLeftRadius: 6,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        flexDirection: 'row',
        gap: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.hairline,
      }}
    >
      {[dot1, dot2, dot3].map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: colors.inkMuted,
            opacity: v,
          }}
        />
      ))}
    </View>
  );
}

function EmptyState({
  colors,
  fonts,
  spacing,
  typeScale,
  borderRadius,
  suggestions,
  onPick,
}: BubbleStyleProps & {
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingVertical: spacing.xl }}>
      <FadeSlideIn duration={420}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.accentMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Sparkles size={26} color={colors.accent} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: fonts.bodySemibold,
              fontSize: 18,
              color: colors.ink,
              textAlign: 'center',
              marginBottom: spacing.xs,
            }}
          >
            Bonjour, je suis ton assistant DriveWise
          </Text>
          <Text
            style={{
              ...typeScale.bodyMd,
              color: colors.inkMuted,
              textAlign: 'center',
              lineHeight: 22,
              paddingHorizontal: spacing.md,
            }}
          >
            Pose-moi une question sur ta fatigue, tes statistiques ou des conseils
            pour mieux gérer tes trajets.
          </Text>
        </View>
      </FadeSlideIn>

      <Text
        style={{
          ...typeScale.caption,
          color: colors.inkSubtle,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: spacing.sm,
        }}
      >
        Suggestions
      </Text>
      <View style={{ gap: spacing.sm }}>
        {suggestions.map((text, i) => (
          <FadeSlideIn key={i} fromY={6} duration={300} delay={120 + i * 60}>
            <Pressable
              onPress={() => onPick(text)}
              style={({ pressed }) => ({
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surfaceElevated,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.hairline,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ ...typeScale.bodyMd, color: colors.ink }}>{text}</Text>
            </Pressable>
          </FadeSlideIn>
        ))}
      </View>
    </View>
  );
}
