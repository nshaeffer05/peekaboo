import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/lib/auth';
import { enablePush } from './src/lib/notifications';
import { SnapsProvider } from './src/lib/snaps';
import { colors, loadScheme, useScheme } from './src/lib/theme';
import { AppNavigator } from './src/navigation';
import { AuthScreen } from './src/screens/auth/AuthScreen';

const Gate = () => {
  const { session, loading } = useAuth();
  useEffect(() => { if (session) void enablePush(); }, [session]);
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.blueJean} />
      </View>
    );
  }
  if (!session) return <AuthScreen />;
  return (
    <SnapsProvider>
      <AppNavigator />
    </SnapsProvider>
  );
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [, version] = useScheme();
  useEffect(() => { loadScheme().finally(() => setReady(true)); }, []);
  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style={colors.dark ? 'light' : 'dark'} />
        {/* Keyed on the scheme version: a colour change rebuilds every sheet from the root. */}
        <Gate key={version} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
