import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Home,
  Car,
  History as HistoryIcon,
  BarChart3,
  MessageSquare,
  LucideIcon,
} from 'lucide-react-native';

import { LoginScreen, RegisterScreen, ConsentScreen } from '@/screens/auth';
import EducationScreen from '@/screens/education/EducationScreen';
import { DashboardScreen } from '@/screens/dashboard';
import { ActiveShiftScreen } from '@/screens/active-shift';
import { HistoryScreen } from '@/screens/history';
import ShiftDetailScreen from '@/screens/history/ShiftDetailScreen';
import { StatsScreen } from '@/screens/stats';
import { ChatScreen } from '@/screens/chat';
import { SettingsScreen } from '@/screens/settings';
import { useAuthStore, useNotificationStore } from '@/store';
import { useTheme } from '@/contexts/ThemeContext';
import { requestNotificationPermissions, scheduleSessionStartReminder, cancelSessionStartReminder } from '@/services/notifications';
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

const BAR_HEIGHT = 64;
const BAR_RADIUS = 22;
const PILL_INSET = 5;

function TabIcon({
  Icon,
  color,
  focused,
}: {
  Icon: LucideIcon;
  color: string;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1.18 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.18 : 1,
      stiffness: 340,
      damping: 18,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon size={21} color={color} strokeWidth={focused ? 2.3 : 1.6} />
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const SIDE = 16;
  const tabCount = state.routes.length;
  const tabW = (width - SIDE * 2) / tabCount;

  const slideX = useRef(
    new Animated.Value(state.index * tabW + PILL_INSET)
  ).current;

  useEffect(() => {
    Animated.spring(slideX, {
      toValue: state.index * tabW + PILL_INSET,
      stiffness: 380,
      damping: 30,
      mass: 0.85,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabW]);

  const centerIdx = Math.floor(tabCount / 2);

  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderTopLeftRadius: BAR_RADIUS,
        borderTopRightRadius: BAR_RADIUS,
        paddingHorizontal: SIDE,
        paddingBottom: insets.bottom,
        // top shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.hairline,
      }}
    >
      {/* Sliding pill indicator */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: PILL_INSET,
          left: SIDE,
          width: tabW - PILL_INSET * 2,
          height: BAR_HEIGHT - PILL_INSET * 2,
          backgroundColor: colors.accentMuted,
          borderRadius: BAR_RADIUS - PILL_INSET,
          transform: [{ translateX: slideX }],
        }}
      />

      {/* Tab row */}
      <View style={{ flexDirection: 'row', height: BAR_HEIGHT }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const isCenter = index === centerIdx;
          const label =
            (typeof options.tabBarLabel === 'string' ? options.tabBarLabel : null) ??
            options.title ??
            route.name;

          const iconColor = focused ? colors.accent : colors.inkSubtle;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              {/* Le contenu est contraint à la largeur de la pill */}
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingHorizontal: PILL_INSET + 2,
                width: '100%',
              }}>
                {options.tabBarIcon?.({ focused, color: iconColor, size: 21 })}
                <Text
                  style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: isCenter ? 9.5 : 9,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: focused ? colors.accent : colors.inkSubtle,
                    opacity: focused ? 1 : 0.65,
                    width: '100%',
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabsNavigator() {
  return (
    <MainTabs.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
        name="Assistant"
        component={ChatScreen}
        options={{
          tabBarLabel: 'DriveSafe',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={MessageSquare} color={color} focused={focused} />
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
    </MainTabs.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading, hasConsented } = useAuthStore();
  const needsConsent = isAuthenticated && !hasConsented;
  console.log('[NAV] isAuthenticated:', isAuthenticated, '| hasConsented:', hasConsented, '| needsConsent:', needsConsent);
  const { loadPrefs, notificationsEnabled, sessionStartEnabled, sessionStartHour, sessionStartMinute } = useNotificationStore();

  React.useEffect(() => {
    if (!isAuthenticated || needsConsent) return;
    loadPrefs().then(() => {
      if (notificationsEnabled) {
        requestNotificationPermissions();
        if (sessionStartEnabled) {
          scheduleSessionStartReminder(sessionStartHour, sessionStartMinute);
        } else {
          cancelSessionStartReminder();
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, needsConsent]);

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
          needsConsent ? (
            <RootStack.Screen
              name="Consent"
              component={ConsentScreen}
              options={{ animation: 'fade' }}
            />
          ) : (
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
              <RootStack.Screen
                name="Education"
                component={EducationScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <RootStack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ animation: 'slide_from_right' }}
              />
            </>
          )
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
