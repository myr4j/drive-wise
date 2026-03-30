import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

import { colors, spacing } from '@/utils/theme';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>
              Oups !
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Une erreur est survenue
            </Text>
            {error && (
              <Text variant="bodySmall" style={styles.error}>
                {error.message || 'Erreur inconnue'}
              </Text>
            )}
            <Button
              mode="contained"
              onPress={this.handleRetry}
              style={styles.button}
            >
              Réessayer
            </Button>
          </View>
        </View>
      );
    }

    return children || null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  error: {
    color: colors.error,
    backgroundColor: colors.error + '10',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  button: {
    minWidth: 120,
  },
});
