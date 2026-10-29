import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, type LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Icon, type IconName } from '../components/Icon';
import { SITE_URL } from '../lib/links';
import { useSnaps } from '../lib/snaps';
import { colors, useScheme } from '../lib/theme';
import { CameraScreen } from '../screens/CameraScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { GroupEditScreen } from '../screens/GroupEditScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { MyCodeScreen } from '../screens/MyCodeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { ProfileStackParams, TabParams } from './types';

const Stack = createNativeStackNavigator<ProfileStackParams>();
const Tabs = createBottomTabNavigator<TabParams>();

const ProfileStack = ({ startOnSettings = false }: { startOnSettings?: boolean }) => (
  <Stack.Navigator
    initialRouteName={startOnSettings ? 'Settings' : 'Profile'}
    screenOptions={{
      headerShadowVisible: false,
      headerStyle: { backgroundColor: colors.paper },
      headerTintColor: colors.ink,
      headerTitleStyle: { fontWeight: '800' },
      headerBackButtonDisplayMode: 'minimal',
    }}
  >
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Friends" component={FriendsScreen} options={{ title: '' }} />
    <Stack.Screen name="MyCode" component={MyCodeScreen} options={{ title: '' }} />
    <Stack.Screen name="Scan" component={ScanScreen} options={{ title: '', headerTransparent: true, headerTintColor: '#FFFDF8' }} />
    <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: '' }} />
    <Stack.Screen name="GroupEdit" component={GroupEditScreen} options={{ title: '' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '' }} />
  </Stack.Navigator>
);

const navTheme = () => ({
  ...DefaultTheme,
  dark: colors.dark,
  colors: { ...DefaultTheme.colors, background: colors.paper, card: colors.paper, text: colors.ink, primary: colors.blueJean, border: colors.line },
});

/** Set before the tree remounts (a scheme change) so the user lands back where they were. */
let resumeOnSettings = false;
export const remountOnSettings = () => { resumeOnSettings = true; };
const takeResume = () => { const r = resumeOnSettings; resumeOnSettings = false; return r; };

/** peekaboo://add/<name> and the web add page both open Friends with the name filled in. */
const linking: LinkingOptions<TabParams> = {
  prefixes: ['peekaboo://', SITE_URL],
  config: {
    screens: {
      ProfileTab: { screens: { Friends: 'add/:username?' } },
    },
  },
};

const icon = (name: IconName, big = false) => {
  const TabIcon = ({ color, focused }: { color: string; focused: boolean }) => (
    <Icon name={name} size={big ? 30 : 26} color={color} strokeWidth={focused ? 2.3 : 1.8} />
  );
  TabIcon.displayName = `TabIcon(${name})`;
  return TabIcon;
};

/** Three tabs. The camera sits in the middle and is where the app opens. */
export const AppNavigator = () => {
  const { inbox, requests } = useSnaps();
  useScheme();
  const startOnProfile = takeResume();
  return (
    <NavigationContainer theme={navTheme()} linking={linking}>
      <Tabs.Navigator
        initialRouteName={startOnProfile ? 'ProfileTab' : 'Camera'}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.inkSoft,
          tabBarLabelStyle: { fontWeight: '800', fontSize: 12 },
          tabBarStyle: { backgroundColor: colors.butter, borderTopColor: colors.butterDeep },
          tabBarBadgeStyle: { backgroundColor: colors.crimson, color: '#fff', fontWeight: '800' },
        }}
      >
        <Tabs.Screen
          name="Feed"
          component={FeedScreen}
          options={{ title: 'Feed', tabBarIcon: icon('mailbox'), tabBarBadge: inbox.length || undefined }}
        />
        <Tabs.Screen name="Camera" component={CameraScreen} options={{ title: 'Camera', tabBarIcon: icon('camera', true) }} />
        <Tabs.Screen name="ProfileTab" options={{ title: 'Profile', tabBarIcon: icon('bearTophat'), tabBarBadge: requests || undefined }}>
          {() => <ProfileStack startOnSettings={startOnProfile} />}
        </Tabs.Screen>
      </Tabs.Navigator>
    </NavigationContainer>
  );
};
