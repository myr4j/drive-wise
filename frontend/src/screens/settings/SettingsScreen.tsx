import React from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Text, Button, Card, Divider, List } from 'react-native-paper';
import { colors, spacing, borderRadius } from '@/utils/theme';
import { useAuthStore } from '@/store';
import { getFatigueLabel } from '@/utils/formatters';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const { driver, clearDriver } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => {
            clearDriver();
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export des données',
      "Cette fonctionnalité sera disponible prochainement. Vous pourrez exporter l'historique de vos trajets et données de fatigue.",
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    // Open privacy policy URL
    Linking.openURL('https://drivewise.example.com/privacy').catch(() => {
      Alert.alert('Information', 'Politique de confidentialité non disponible');
    });
  };

  const handleTermsOfService = () => {
    // Open terms of service URL
    Linking.openURL('https://drivewise.example.com/terms').catch(() => {
      Alert.alert('Information', "Conditions d'utilisation non disponibles");
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Paramètres</Text>
      </View>

      {/* Profile Section */}
      {driver && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Profil
            </Text>
            <List.Item
              title={driver.username}
              description={driver.email}
              left={(props) => <List.Icon {...props} icon="account" />}
            />
          </Card.Content>
        </Card>
      )}

      {/* App Info */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Application
          </Text>
          <List.Item
            title="Version"
            description={`v${APP_VERSION}`}
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </Card.Content>
      </Card>

      {/* Data & Privacy */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Données et confidentialité
          </Text>
          <List.Item
            title="Exporter mes données"
            description="Télécharger l'historique des trajets"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={handleExportData}
          />
          <Divider />
          <List.Item
            title="Politique de confidentialité"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={handlePrivacyPolicy}
          />
          <Divider />
          <List.Item
            title="Conditions d'utilisation"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={handleTermsOfService}
          />
        </Card.Content>
      </Card>

      {/* Fatigue Level Reference */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Niveaux de fatigue
          </Text>
          <View style={styles.fatigueLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.fatigueLow }]} />
              <Text variant="bodySmall">Faible (&lt; 30%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.fatigueModerate }]} />
              <Text variant="bodySmall">Modéré (30-60%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.fatigueHigh }]} />
              <Text variant="bodySmall">Élevé (60-80%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.fatigueCritical }]} />
              <Text variant="bodySmall">Critique (&gt; 80%)</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Logout */}
      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor={colors.error}
      >
        Se déconnecter
      </Button>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  card: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.darkGray,
  },
  fatigueLegend: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  logoutButton: {
    margin: spacing.md,
  },
  footer: {
    height: spacing.xl,
  },
});
