import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconButton } from 'react-native-paper';

import { LoginScreen, RegisterScreen } from '@/screens/auth';
import { DashboardScreen } from '@/screens/dashboard';
import { ActiveShiftScreen } from '@/screens/active-shift';
import { HistoryScreen } from '@/screens/history';
import ShiftDetailScreen from '@/screens/history/ShiftDetailScreen';
import { StatsScreen } from '@/screens/stats';
import { SettingsScreen } from '@/screens/settings';
import { useAuthStore } from '@/store';
import { colors } from '@/utils/theme';

import type { RootStackParamList, MainTabsParamList } from '@/types/navigation';

type ExtendedRootStackParamList = RootStackParamList & {
  ShiftDetail: { shiftId: string };
};

const RootStack = createNativeStackNavigator<ExtendedRootStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabsParamList>();

function MainTabsNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        headerShown: false,
      }}
    >
      <MainTabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color }) => (
            <IconButton icon="home" size={24} iconColor={color} />
          ),
        }}
      />
      <MainTabs.Screen
        name="ActiveShift"
        component={ActiveShiftScreen}
        options={{
          tabBarLabel: 'Trajet',
          tabBarIcon: ({ color }) => (
            <IconButton icon="car" size={24} iconColor={color} />
          ),
        }}
      />
      <MainTabs.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color }) => (
            <IconButton icon="history" size={24} iconColor={color} />
          ),
        }}
      />
      <MainTabs.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color }) => (
            <IconButton icon="chart-bar" size={24} iconColor={color} />
          ),
        }}
      />
      <MainTabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Paramètres',
          tabBarIcon: ({ color }) => (
            <IconButton icon="cog" size={24} iconColor={color} />
          ),
        }}
      />
    </MainTabs.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading screen while auth state is being determined
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabsNavigator} />
            <RootStack.Screen
              name="ShiftDetail"
              component={ShiftDetailScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Détails du trajet',
              }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
