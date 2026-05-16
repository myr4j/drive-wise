import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
  title?: string;
  duration: number;
};

type ToastContextValue = {
  show: (input: {
    kind?: ToastKind;
    message: string;
    title?: string;
    duration?: number;
  }) => void;
  info: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  info: () => {},
  success: () => {},
  warning: () => {},
  error: () => {},
});

let nextId = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const show = useCallback(
    ({
      kind = 'info',
      message,
      title,
      duration = 3500,
    }: {
      kind?: ToastKind;
      message: string;
      title?: string;
      duration?: number;
    }) => {
      const id = nextId++;
      setToast({ id, kind, message, title, duration });

      if (kind === 'error') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
      } else if (kind === 'warning') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        ).catch(() => {});
      } else if (kind === 'success') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
      }
    },
    []
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      info: (message, title) => show({ kind: 'info', message, title }),
      success: (message, title) => show({ kind: 'success', message, title }),
      warning: (message, title) => show({ kind: 'warning', message, title }),
      error: (message, title) => show({ kind: 'error', message, title }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <ToastView
          key={toast.id}
          toast={toast}
          onDismiss={() =>
            setToast((cur) => (cur?.id === toast.id ? null : cur))
          }
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => useContext(ToastContext);

// ---- View ---------------------------------------------------------------

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

function ToastView({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const { colors, shadows, spacing, fonts, typeScale, borderRadius } =
    useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.bezier(0.2, 0, 0, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      hide();
    }, toast.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hide = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 240,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [onDismiss]);

  const Icon = ICONS[toast.kind];
  const accent =
    toast.kind === 'success'
      ? colors.fatigueRest
      : toast.kind === 'warning'
      ? colors.fatigueWatch
      : toast.kind === 'error'
      ? colors.error
      : colors.accent;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.md,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        onPress={hide}
        accessibilityRole="alert"
        style={[
          styles.toast,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: borderRadius.lg,
            borderLeftWidth: 3,
            borderLeftColor: accent,
            paddingVertical: spacing.md,
            paddingLeft: spacing.md,
            paddingRight: spacing.sm,
            ...shadows.floating,
          },
        ]}
      >
        <View style={[styles.iconWrap, { marginRight: spacing.sm }]}>
          <Icon size={20} color={accent} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          {toast.title && (
            <Text
              style={{
                ...typeScale.titleSm,
                color: colors.ink,
                marginBottom: 2,
              }}
            >
              {toast.title}
            </Text>
          )}
          <Text
            style={{
              ...typeScale.bodyMd,
              color: colors.inkMuted,
              fontFamily: fonts.body,
            }}
          >
            {toast.message}
          </Text>
        </View>
        <Pressable
          onPress={hide}
          hitSlop={10}
          style={{ padding: 4, marginLeft: spacing.xs }}
          accessibilityLabel="Fermer"
        >
          <X size={16} color={colors.inkSubtle} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    width: SCREEN_WIDTH,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    marginTop: 2,
  },
});
