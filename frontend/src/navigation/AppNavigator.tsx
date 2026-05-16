import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  Car,
  History as HistoryIcon,
  BarChart3,
  Settings as SettingsIcon,
  LucideIcon,
} from 'lucide-react-native';

import { LoginScreen, RegisterScreen } from '@/screens/auth';
import { DashboardScreen } from '@/screens/dashboard';
import { ActiveShiftScreen } from '@/screens/active-shift';
import { HistoryScreen } from '@/screens/history';
import ShiftDetailScreen from '@/screens/history/ShiftDetailScreen';
import { StatsScreen } from '@/screens/stats';
import { SettingsScreen } from '@/screens/settings';
import { useAuthStore } from '@/store';
import { useTheme } from '@/contexts/ThemeContext';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

import type {
  RootStackParamList,
  MainTabsParamList,
} from '@/types/navigation';

type ExtendedRootStackParamList = RootStackParamList & {
  ShiftDetail: { shiftId: string };
};

const RootStack = createNativeStackNavigator<ExtendedRootStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabsParamList>();

function TabIcon({
  Icon,
  color,
  focused,
}: {
  Icon: LucideIcon;
  color: string;
  focused: boolean;
}) {
  // Tiny pop when focused: subtle vertical lift via marginBottom shift
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 4,
      }}
    >
      <Icon
        size={22}
        color={color}
        strokeWidth={focused ? 2.2 : 1.6}
      />
    </View>
  );
}

function MainTabsNavigator() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <MainTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkSubtle,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.hairline,
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 4,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <MainTabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <MainTabs.Screen
        name="ActiveShift"
        component={ActiveShiftScreen}
        options={{
          tabBarLabel: 'Trajet',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Car} color={color} focused={focused} />
          ),
        }}
      />
      <MainTabs.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={HistoryIcon} color={color} focused={focused} />
          ),
        }}
      />
      <MainTabs.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={BarChart3} color={color} focused={focused} />
          ),
        }}
      />
      <MainTabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Réglages',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={SettingsIcon} color={color} focused={focused} />
          ),
        }}
      />
    </MainTabs.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.surface }]}
      >
        <LoadingOverlay visible message="DriveWise" fullScreen={false} />
      </View>
    );
  }

  // Theme React Navigation's container so its built-in scrim/transition
  // surfaces inherit our palette.
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.surface,
      card: colors.surfaceElevated,
      text: colors.ink,
      border: colors.hairline,
      primary: colors.accent,
      notification: colors.accent,
    },
  };

  // Spring + fade-up transition for stack screens (auth flow + modals)
  const stackScreenOptions: NativeStackNavigationOptions = {
    headerShown: false,
    animation: 'fade_from_bottom',
    animationDuration: 280,
    contentStyle: { backgroundColor: colors.surface },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={stackScreenOptions}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen
              name="MainTabs"
              component={MainTabsNavigator}
              options={{ animation: 'fade' }}
            />
            <RootStack.Screen
              name="ShiftDetail"
              component={ShiftDetailScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
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
  },
});
