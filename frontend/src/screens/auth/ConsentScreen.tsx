import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  MapPin,
  Brain,
  BarChart3,
  Download,
  Trash2,
  ShieldCheck,
} from 'lucide-react-native';
import FadeSlideIn from '@/components/ui/FadeSlideIn';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store';
import { authApi } from '@/services';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';

interface ConsentItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function ConsentScreen() {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const { driver, setDriver, setConsented, clearDriver } = useAuthStore();
  const toast = useToast();
  const [isAccepting, setIsAccepting] = useState(false);

  const consentItems: ConsentItem[] = [
    {
      icon: <MapPin size={20} color={colors.accent} strokeWidth={1.8} />,
      title: 'Localisation GPS',
      description: 'Votre position est collectée pendant les sessions de conduite pour calculer vitesse et comportement routier.',
    },
    {
      icon: <Brain size={20} color={colors.accent} strokeWidth={1.8} />,
      title: 'Analyse IA de la fatigue',
      description: 'Un modèle de machine learning analyse vos données de conduite pour estimer votre niveau de fatigue en temps réel.',
    },
    {
      icon: <BarChart3 size={20} color={colors.accent} strokeWidth={1.8} />,
      title: 'Historique et statistiques',
      description: 'Vos sessions, scores de fatigue et métriques sont conservés pour vous permettre de suivre vos progrès.',
    },
  ];

  const rights = [
    { icon: <Download size={16} color={colors.inkMuted} strokeWidth={1.8} />, text: 'Télécharger toutes vos données' },
    { icon: <Trash2 size={16} color={colors.inkMuted} strokeWidth={1.8} />, text: 'Supprimer votre compte à tout moment' },
  ];

  const handleAccept = async () => {
    if (!driver) return;
    setIsAccepting(true);
    try {
      const result = await authApi.acceptConsent(driver.id);
      // On met à jour le driver ET on positionne hasConsented explicitement
      setDriver({ ...driver, consent_at: result.consent_at, consent_version: result.consent_version });
      setConsented();
    } catch {
      toast.error('Impossible d\'enregistrer le consentement. Réessayez.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRefuse = () => {
    Alert.alert(
      'Refuser le consentement',
      'Sans consentement, l\'application ne peut pas fonctionner. Votre compte sera supprimé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: async () => {
            if (!driver) return;
            try {
              await authApi.deleteAccount(driver.id);
            } catch {
              // compte peut déjà être supprimé ou erreur réseau — on déconnecte quand même
            }
            clearDriver();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxl,
        paddingBottom: spacing.xxxl,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <FadeSlideIn duration={360}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accent + '18', borderRadius: borderRadius.lg }]}>
          <ShieldCheck size={32} color={colors.accent} strokeWidth={1.6} />
        </View>
        <Text style={{ ...typeScale.caption, color: colors.inkMuted, marginTop: spacing.lg }}>
          Confidentialité et données
        </Text>
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontSize: 34,
            lineHeight: 42,
            color: colors.ink,
            marginTop: spacing.xs,
            letterSpacing: -0.4,
          }}
        >
          Avant de commencer
        </Text>
        <Text style={{ ...typeScale.bodyLg, color: colors.inkMuted, marginTop: spacing.sm, lineHeight: 24 }}>
          Drive-Wise collecte des données pour vous aider à conduire plus sainement. Voici ce que nous faisons avec.
        </Text>
      </FadeSlideIn>

      {/* Données collectées */}
      <FadeSlideIn fromY={10} duration={380} delay={80}>
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          {consentItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.consentCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: borderRadius.md,
                  borderColor: colors.hairline,
                  padding: spacing.md,
                },
              ]}
            >
              <View style={[styles.iconBadge, { backgroundColor: colors.accent + '14', borderRadius: borderRadius.sm }]}>
                {item.icon}
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={{ ...typeScale.bodyMd, color: colors.ink, fontFamily: fonts.bodySemibold }}>
                  {item.title}
                </Text>
                <Text style={{ ...typeScale.bodySm, color: colors.inkMuted, marginTop: 3, lineHeight: 20 }}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </FadeSlideIn>

      {/* Vos droits */}
      <FadeSlideIn fromY={10} duration={380} delay={160}>
        <View
          style={[
            styles.rightsBox,
            {
              backgroundColor: colors.surfaceSunken,
              borderRadius: borderRadius.md,
              marginTop: spacing.xl,
              padding: spacing.md,
              gap: spacing.sm,
            },
          ]}
        >
          <Text style={{ ...typeScale.caption, color: colors.inkMuted, marginBottom: spacing.xs }}>
            VOS DROITS
          </Text>
          {rights.map((right, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {right.icon}
              <Text style={{ ...typeScale.bodySm, color: colors.inkSubtle, flex: 1 }}>{right.text}</Text>
            </View>
          ))}
          <Text style={{ ...typeScale.bodySm, color: colors.inkMuted, marginTop: spacing.xs, lineHeight: 18 }}>
            Vos données ne sont jamais vendues à des tiers. Elles restent sur nos serveurs et sont utilisées uniquement pour le calcul de fatigue.
          </Text>
        </View>
      </FadeSlideIn>

      {/* Actions */}
      <FadeSlideIn fromY={10} duration={380} delay={240}>
        <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleAccept}
            loading={isAccepting}
          >
            J'accepte et je continue
          </Button>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onPress={handleRefuse}
          >
            Refuser et supprimer mon compte
          </Button>
        </View>
        <Text
          style={{
            ...typeScale.bodySm,
            color: colors.inkMuted,
            textAlign: 'center',
            marginTop: spacing.lg,
            lineHeight: 18,
          }}
        >
          En acceptant, vous consentez à la collecte et au traitement de vos données conformément au RGPD (version 1.0).
        </Text>
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rightsBox: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
