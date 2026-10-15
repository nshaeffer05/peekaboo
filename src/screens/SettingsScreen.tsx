import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field } from '../components/Field';
import { Body, Button, Card, Heading, Screen, Small } from '../components/ui';
import { api } from '../lib/api';
import { PASSWORD_RULE, useAuth, validPassword } from '../lib/auth';
import { PRIVACY_URL, SUPPORT_EMAIL, SUPPORT_URL, TERMS_URL } from '../lib/links';
import { enablePush, permissionState, type PermissionState } from '../lib/notifications';
import { colors, space } from '../lib/theme';

export const SettingsScreen = () => {
  const { signOut, changePassword } = useAuth();
  const [push, setPush] = useState<PermissionState>('undetermined');
  const [blocks, setBlocks] = useState<{ id: string; username: string }[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    permissionState().then(setPush);
    api.myBlocks().then(setBlocks).catch(() => {});
  }, []);

  const savePassword = async () => {
    if (!validPassword(newPassword)) return Alert.alert('Weak password', PASSWORD_RULE);
    setBusy(true);
    try { await changePassword(newPassword); setNewPassword(''); Alert.alert('Done', 'Password changed.'); }
    catch (e) { Alert.alert('Could not change password', (e as Error).message); }
    finally { setBusy(false); }
  };

  const unblock = async (id: string) => {
    await api.unblockUser(id);
    setBlocks((b) => b.filter((x) => x.id !== id));
  };

  const deleteAccount = () =>
    Alert.alert('Delete your account?', 'Your profile, friends and anything unopened go with it. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => api.deleteAccount().catch((e) => Alert.alert('Failed', e.message)) },
    ]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Heading>Settings</Heading>

        <Card style={{ gap: 8 }}>
          <Body style={{ fontWeight: '800' }}>Notifications</Body>
          <Small>Get a ping when a friend sends you a photo. Unopened photos vanish after a day.</Small>
          {push === 'granted' && <Small style={{ color: colors.moss }}>On ✓</Small>}
          {push === 'undetermined' && <Button title="Turn on" small onPress={() => enablePush().then(setPush)} />}
          {push === 'blocked' && <Button title="Open iOS Settings" small variant="secondary" onPress={() => Linking.openSettings()} />}
        </Card>

        <Card style={{ gap: 8 }}>
          <Body style={{ fontWeight: '800' }}>Change password</Body>
          <Field placeholder="new password" secureTextEntry textContentType="newPassword" value={newPassword} onChangeText={setNewPassword} />
          <Button title="Save" small onPress={savePassword} loading={busy} disabled={!newPassword} />
        </Card>

        {blocks.length > 0 && (
          <Card style={{ gap: 8 }}>
            <Body style={{ fontWeight: '800' }}>Blocked</Body>
            {blocks.map((b) => (
              <View key={b.id} style={styles.row}>
                <Body>@{b.username}</Body>
                <Button title="Unblock" small variant="ghost" onPress={() => unblock(b.id)} />
              </View>
            ))}
          </Card>
        )}

        <Card style={{ gap: 6 }}>
          <Body style={{ fontWeight: '800' }}>About</Body>
          <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>Terms of Use</Text>
          <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>
          <Text style={styles.link} onPress={() => Linking.openURL(SUPPORT_URL)}>Help &amp; support</Text>
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>{SUPPORT_EMAIL}</Text>
        </Card>

        <Button title="Sign out" variant="secondary" onPress={signOut} />
        <Button title="Delete account" variant="ghost" onPress={deleteAccount} />
        <Small style={{ textAlign: 'center' }}>Peekaboo {Constants.expoConfig?.version}</Small>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrap: { padding: space.lg, gap: space.md, paddingBottom: 64 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: colors.blueJean, fontWeight: '800', fontSize: 15, paddingVertical: 4 },
});
