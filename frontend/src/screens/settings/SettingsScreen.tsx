import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ChevronRight,
  Download,
  FileText,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Smartphone,
  Info,
  User,
  Trash2,
  Bell,
  BellOff,
  Clock,
  VolumeX,
} from 'lucide-react-native';
import FadeSlideIn from '@/components/ui/FadeSlideIn';

import Screen from '@/components/layout/Screen';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore, useNotificationStore } from '@/store';
import {
  requestNotificationPermissions,
  scheduleSessionStartReminder,
  cancelSessionStartReminder,
  cancelAllReminders,
} from '@/services/notifications';
import { authApi } from '@/services';
import {
  useTheme,
  ColorSchemePreference,
} from '@/contexts/ThemeContext';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const { driver, clearDriver } = useAuthStore();
  const {
    notificationsEnabled,
    quietMode,
    sessionStartEnabled,
    sessionStartHour,
    sessionEndEnabled,
    sessionEndThresholdHours,
    setPrefs,
  } = useNotificationStore();
  const toast = useToast();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => clearDriver(),
        },
      ]
    );
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    if (!driver) return;
    setIsExporting(true);
    try {
      const data = await authApi.exportData(driver.id);
      const json = JSON.stringify(data, null, 2);
      // On affiche un résumé — un vrai téléchargement nécessite expo-file-system
      toast.success(
        `${(json.length / 1024).toFixed(1)} Ko de données prêtes. Intégration fichier à venir.`,
        'Export réussi'
      );
    } catch {
      toast.error('Impossible d\'exporter les données.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Votre compte sera anonymisé et vous serez déconnecté.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!driver) return;
            try {
              await authApi.deleteAccount(driver.id);
              toast.success('Compte supprimé');
            } catch {
              // Si erreur réseau, on déconnecte quand même côté front
            }
            clearDriver();
          },
        },
      ]
    );
  };

  const openLink = async (url: string, fallback: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.warning(fallback);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.warning('Entrez un nouveau mot de passe');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Les mots de passe ne correspondent pas');
      return;
    }
    setIsChanging(true);
    try {
      await authApi.resetPassword({ email: driver?.email ?? '', password: newPassword });
      toast.success('Mot de passe changé');
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de changer le mot de passe');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Screen
      scrollable
      edges={{ top: true, bottom: true }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.xl,
      }}
    >
      {/* Title */}
      <FadeSlideIn duration={360}>
        <Text style={{ ...typeScale.caption, color: colors.inkMuted }}>
          Vos préférences
        </Text>
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
          Paramètres
        </Text>
      </FadeSlideIn>

      {/* Profile */}
      {driver && (
        <Section title="Profil">
          <SettingsRow
            icon={<User size={18} color={colors.inkMuted} />}
            title={driver.username}
            subtitle={driver.email}
          />
          <SettingsRow
            icon={<ShieldCheck size={18} color={colors.inkMuted} />}
            title="Changer le mot de passe"
            onPress={() => setShowChangePassword(v => !v)}
            showChevron
          />
          {showChangePassword && (
            <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
              <Input
                label="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Input
                label="Confirmer mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <View style={{ marginTop: spacing.sm }}>
                <Button variant="primary" size="md" fullWidth onPress={handleChangePassword} loading={isChanging}>
                  Changer le mot de passe
                </Button>
              </View>
            </View>
          )}
        </Section>
      )}

      {/* Appearance toggle */}
      <Section title="Apparence">
        <AppearancePicker />
      </Section>

      {/* App info */}
      <Section title="Application">
        <SettingsRow
          icon={<Info size={18} color={colors.inkMuted} />}
          title="Version"
          subtitle={`v${APP_VERSION}`}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <NotificationToggleRow
          icon={notificationsEnabled
            ? <Bell size={18} color={colors.inkMuted} />
            : <BellOff size={18} color={colors.inkMuted} />
          }
          title="Notifications activées"
          value={notificationsEnabled}
          onToggle={async (v) => {
            await setPrefs({ notificationsEnabled: v });
            if (v) {
              const granted = await requestNotificationPermissions();
              if (!granted) toast.warning('Autorisez les notifications dans les paramètres système.');
            } else {
              await cancelAllReminders();
            }
          }}
        />
        <Divider />
        <NotificationToggleRow
          icon={<VolumeX size={18} color={colors.inkMuted} />}
          title="Mode discret"
          subtitle="Recommandations en app uniquement, sans notification push"
          value={quietMode}
          disabled={!notificationsEnabled}
          onToggle={(v) => setPrefs({ quietMode: v })}
        />
        <Divider />
        <NotificationToggleRow
          icon={<Clock size={18} color={colors.inkMuted} />}
          title="Rappel de début de session"
          subtitle={sessionStartEnabled ? `Chaque jour à ${String(sessionStartHour).padStart(2,'0')}h00` : 'Désactivé'}
          value={sessionStartEnabled}
          disabled={!notificationsEnabled}
          onToggle={async (v) => {
            await setPrefs({ sessionStartEnabled: v });
            if (v) await scheduleSessionStartReminder(sessionStartHour, 0);
            else await cancelSessionStartReminder();
          }}
        />
        {sessionStartEnabled && notificationsEnabled && (
          <HourPicker
            value={sessionStartHour}
            onChange={async (h) => {
              await setPrefs({ sessionStartHour: h });
              await scheduleSessionStartReminder(h, 0);
            }}
          />
        )}
        <Divider />
        <NotificationToggleRow
          icon={<Bell size={18} color={colors.inkMuted} />}
          title="Rappel de fin de session"
          subtitle={sessionEndEnabled ? `Alerte après ${sessionEndThresholdHours}h de conduite` : 'Désactivé'}
          value={sessionEndEnabled}
          disabled={!notificationsEnabled}
          onToggle={(v) => setPrefs({ sessionEndEnabled: v })}
        />
        {sessionEndEnabled && notificationsEnabled && (
          <ThresholdPicker
            value={sessionEndThresholdHours}
            onChange={(h) => setPrefs({ sessionEndThresholdHours: h })}
          />
        )}
      </Section>

      {/* Data & Privacy */}
      <Section title="Données et confidentialité">
        <SettingsRow
          icon={<Download size={18} color={colors.inkMuted} />}
          title={isExporting ? 'Export en cours…' : 'Exporter mes données'}
          subtitle="Télécharger l'historique complet"
          onPress={isExporting ? undefined : handleExportData}
          showChevron={!isExporting}
        />
        <Divider />
        <SettingsRow
          icon={<ShieldCheck size={18} color={colors.inkMuted} />}
          title="Politique de confidentialité"
          onPress={() =>
            openLink(
              'https://drivewise.example.com/privacy',
              'Politique non disponible'
            )
          }
          showChevron
        />
        <Divider />
        <SettingsRow
          icon={<FileText size={18} color={colors.inkMuted} />}
          title="Conditions d'utilisation"
          onPress={() =>
            openLink(
              'https://drivewise.example.com/terms',
              'Conditions non disponibles'
            )
          }
          showChevron
        />
        <Divider />
        <SettingsRow
          icon={<Trash2 size={18} color={colors.fatigueStop} />}
          title="Supprimer mon compte"
          subtitle="Action irréversible"
          onPress={handleDeleteAccount}
          showChevron
          danger
        />
      </Section>

      {/* Fatigue legend */}
      <Section title="Niveaux de fatigue">
        <FatigueLegendRow
          color={colors.fatigueRest}
          label="Faible"
          range="< 30%"
        />
        <FatigueLegendRow
          color={colors.fatigueWatch}
          label="Modéré"
          range="30–60%"
        />
        <FatigueLegendRow
          color={colors.fatigueAlert}
          label="Élevé"
          range="60–80%"
        />
        <FatigueLegendRow
          color={colors.fatigueStop}
          label="Critique"
          range="> 80%"
        />
      </Section>

      {/* Logout */}
      <View style={{ marginTop: spacing.md }}>
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onPress={handleLogout}
          icon={<LogOut size={16} color={colors.ink} />}
        >
          Se déconnecter
        </Button>
      </View>
    </Screen>
  );
}

// ---- Section wrapper ---------------------------------------------------
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors, spacing, typeScale } = useTheme();
  return (
    <View>
      <Text
        style={{
          ...typeScale.caption,
          color: colors.inkMuted,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      <Card noPadding>
        <View style={{ paddingVertical: spacing.xs }}>{children}</View>
      </Card>
    </View>
  );
}

function Divider() {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.hairline,
        marginHorizontal: spacing.md,
      }}
    />
  );
}

// ---- Settings row ------------------------------------------------------
function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  showChevron,
  danger,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) {
  const { colors, fonts, spacing, typeScale } = useTheme();

  const rowContent = (
    <>
      {icon && (
        <View style={{ width: 28, alignItems: 'center', marginRight: spacing.sm }}>
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ ...typeScale.bodyMd, color: danger ? colors.fatigueStop : colors.ink, fontFamily: fonts.bodyMedium }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ ...typeScale.bodySm, color: colors.inkMuted, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && (
        <ChevronRight size={16} color={colors.inkSubtle} strokeWidth={2} />
      )}
    </>
  );

  const baseStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ ...baseStyle, opacity: pressed ? 0.6 : 1 })}
      >
        {rowContent}
      </Pressable>
    );
  }

  return <View style={baseStyle}>{rowContent}</View>;
}

// ---- Fatigue legend row ------------------------------------------------
function FatigueLegendRow({
  color,
  label,
  range,
}: {
  color: string;
  label: string;
  range: string;
}) {
  const { colors, fonts, spacing, typeScale } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          marginRight: spacing.md,
        }}
      />
      <Text
        style={{
          ...typeScale.bodyMd,
          color: colors.ink,
          fontFamily: fonts.bodyMedium,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          ...typeScale.bodySm,
          color: colors.inkMuted,
          fontFamily: fonts.monoRegular,
        }}
      >
        {range}
      </Text>
    </View>
  );
}

// ---- Notification toggle row ------------------------------------------
function NotificationToggleRow({
  icon,
  title,
  subtitle,
  value,
  disabled,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value: boolean;
  disabled?: boolean;
  onToggle: (v: boolean) => void;
}) {
  const { colors, fonts, spacing, typeScale } = useTheme();
  return (
    <Pressable
      onPress={() => !disabled && onToggle(!value)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        opacity: pressed || disabled ? 0.5 : 1,
      })}
    >
      <View style={{ width: 28, alignItems: 'center', marginRight: spacing.sm }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typeScale.bodyMd, color: colors.ink, fontFamily: fonts.bodyMedium }}>{title}</Text>
        {subtitle && <Text style={{ ...typeScale.bodySm, color: colors.inkMuted, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      <View
        style={{
          width: 42,
          height: 24,
          borderRadius: 12,
          backgroundColor: value && !disabled ? colors.accent : colors.surfaceSunken,
          justifyContent: 'center',
          paddingHorizontal: 3,
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.surfaceElevated,
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
    </Pressable>
  );
}

// ---- Hour picker (6h–22h) --------------------------------------------
function HourPicker({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const HOURS = [6, 7, 8, 9, 10, 11, 12];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
      {HOURS.map((h) => (
        <Pressable
          key={h}
          onPress={() => onChange(h)}
          style={{
            paddingVertical: 4,
            paddingHorizontal: spacing.sm,
            borderRadius: borderRadius.sm,
            backgroundColor: value === h ? colors.accent : colors.surfaceSunken,
          }}
        >
          <Text style={{
            ...typeScale.bodySm,
            color: value === h ? colors.onAccent : colors.inkMuted,
            fontFamily: fonts.monoRegular,
          }}>
            {String(h).padStart(2, '0')}h
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---- Threshold picker (8h, 10h, 12h) ---------------------------------
function ThresholdPicker({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const OPTIONS = [8, 10, 12];
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
      {OPTIONS.map((h) => (
        <Pressable
          key={h}
          onPress={() => onChange(h)}
          style={{
            paddingVertical: 4,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.sm,
            backgroundColor: value === h ? colors.accent : colors.surfaceSunken,
          }}
        >
          <Text style={{
            ...typeScale.bodySm,
            color: value === h ? colors.onAccent : colors.inkMuted,
            fontFamily: fonts.monoRegular,
          }}>
            {h}h
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---- Appearance picker (system / light / dark) ------------------------
function AppearancePicker() {
  const { colors, fonts, spacing, typeScale, borderRadius, preference, setPreference } =
    useTheme();

  const options: {
    value: ColorSchemePreference;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'system',
      label: 'Système',
      icon: <Smartphone size={16} strokeWidth={2} color={colors.inkMuted} />,
    },
    {
      value: 'light',
      label: 'Clair',
      icon: <Sun size={16} strokeWidth={2} color={colors.inkMuted} />,
    },
    {
      value: 'dark',
      label: 'Sombre',
      icon: <Moon size={16} strokeWidth={2} color={colors.inkMuted} />,
    },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        margin: spacing.md,
        backgroundColor: colors.surfaceSunken,
        borderRadius: borderRadius.md,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const isActive = preference === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setPreference(opt.value)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.sm,
              backgroundColor: isActive
                ? colors.surfaceElevated
                : 'transparent',
            }}
          >
            {React.cloneElement(opt.icon as React.ReactElement, {
              color: isActive ? colors.ink : colors.inkMuted,
            } as any)}
            <Text
              style={{
                ...typeScale.bodySm,
                color: isActive ? colors.ink : colors.inkMuted,
                fontFamily: isActive ? fonts.bodySemibold : fonts.bodyMedium,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
