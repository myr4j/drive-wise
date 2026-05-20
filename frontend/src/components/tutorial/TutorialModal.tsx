import React, { useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BarChart3,
  Brain,
  Car,
  Check,
  Home,
  LayoutGrid,
  MessageSquare,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/ui/Button';
import TutorialCard from './TutorialCard';
import PaginationDots from './PaginationDots';

interface TutorialModalProps {
  visible: boolean;
  /** Called when the tutorial is dismissed. `shouldRemember` = user checked « ne plus afficher ». */
  onClose: (shouldRemember: boolean) => void;
}

const CARD_COUNT = 3;

export default function TutorialModal({ visible, onClose }: TutorialModalProps) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const sheetHeight = Math.min(height * 0.74, 620);
  const isLast = activeIndex === CARD_COUNT - 1;

  const scrollToIndex = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, y: 0, animated: true });
    setActiveIndex(i);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const handleNext = () => {
    if (isLast) {
      onClose(dontShow);
    } else {
      scrollToIndex(activeIndex + 1);
    }
  };

  const handleSkip = () => {
    // « Passer » et tap backdrop : on ferme sans persister
    onClose(false);
  };

  const reset = () => {
    setActiveIndex(0);
    setDontShow(false);
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onShow={reset}
      onRequestClose={handleSkip}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={handleSkip}
          accessibilityLabel="Fermer le tutoriel"
        />

        <View
          style={{
            backgroundColor: colors.surfaceElevated,
            height: sheetHeight,
            borderTopLeftRadius: borderRadius.xxl,
            borderTopRightRadius: borderRadius.xxl,
            paddingTop: spacing.sm,
            paddingBottom: spacing.lg,
          }}
        >
          {/* Grabber */}
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.hairlineStrong,
              marginBottom: spacing.sm,
            }}
          />

          {/* Top row: Passer */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.xs,
            }}
          >
            <Pressable onPress={handleSkip} hitSlop={10} accessibilityRole="button">
              <Text style={{ ...typeScale.bodySm, color: colors.inkMuted }}>Passer</Text>
            </Pressable>
          </View>

          {/* Horizontal pager */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            style={{ flex: 1 }}
          >
            <TutorialCard
              icon={<Car size={36} color={colors.accent} strokeWidth={1.6} />}
              title="Bienvenue sur Drive-Wise"
            >
              Votre copilote intelligent contre la fatigue au volant. Conduisez plus
              sereinement grâce à un suivi en temps réel.
            </TutorialCard>

            <TutorialCard
              icon={<Brain size={36} color={colors.accent} strokeWidth={1.6} />}
              title="Une IA qui veille sur vous"
            >
              Pendant vos trajets, Drive-Wise analyse votre conduite (durée, pauses,
              heure de la journée) pour estimer votre niveau de fatigue et vous
              alerter si besoin.
            </TutorialCard>

            <TutorialCard
              icon={<LayoutGrid size={36} color={colors.accent} strokeWidth={1.6} />}
              title="Tout est à portée de main"
            >
              <View style={{ gap: spacing.sm, width: '100%', marginTop: spacing.xs }}>
                <FeatureRow
                  icon={<Home size={18} color={colors.accent} strokeWidth={1.8} />}
                  label="Accueil"
                  desc="vue d'ensemble"
                />
                <FeatureRow
                  icon={<Car size={18} color={colors.accent} strokeWidth={1.8} />}
                  label="Trajet"
                  desc="démarrer une session"
                />
                <FeatureRow
                  icon={<MessageSquare size={18} color={colors.accent} strokeWidth={1.8} />}
                  label="DriveSafe"
                  desc="assistant conseils"
                />
                <FeatureRow
                  icon={<BarChart3 size={18} color={colors.accent} strokeWidth={1.8} />}
                  label="Stats"
                  desc="vos tendances"
                />
              </View>
            </TutorialCard>
          </ScrollView>

          {/* Footer area */}
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            <PaginationDots count={CARD_COUNT} active={activeIndex} onPress={scrollToIndex} />

            {isLast && (
              <Pressable
                onPress={() => setDontShow((v) => !v)}
                hitSlop={6}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: dontShow }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: dontShow ? colors.accent : colors.hairlineStrong,
                    backgroundColor: dontShow ? colors.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {dontShow && <Check size={14} color={colors.onAccent} strokeWidth={2.4} />}
                </View>
                <Text style={{ ...typeScale.bodySm, color: colors.inkMuted, flex: 1 }}>
                  Ne plus afficher ce tutoriel
                </Text>
              </Pressable>
            )}

            <Button variant="primary" size="lg" fullWidth onPress={handleNext}>
              {isLast ? 'Terminer' : 'Suivant'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  function FeatureRow({
    icon,
    label,
    desc,
  }: {
    icon: React.ReactNode;
    label: string;
    desc: string;
  }) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.surfaceSunken,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.accent + '18',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        <Text style={{ ...typeScale.bodySm, color: colors.ink, fontFamily: fonts.bodySemibold }}>
          {label}
        </Text>
        <Text style={{ ...typeScale.bodySm, color: colors.inkMuted, flex: 1 }}>
          — {desc}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
