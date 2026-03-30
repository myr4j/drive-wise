import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation';
import { useAuthStore } from '@/store';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function App() {
  const { loadPersistedAuth } = useAuthStore();

  // Load persisted auth state on app start
  useEffect(() => {
    loadPersistedAuth();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
