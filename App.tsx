import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/lib/auth';
import { enablePush } from './src/lib/notifications';
import { SnapsProvider } from './src/lib/snaps';
import { colors } from './src/lib/theme';
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
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
