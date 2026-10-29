import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { remountOnSettings } from '../navigation';
import { Body, Button, Card, Heading, Screen, Small } from '../components/ui';
import { api } from '../lib/api';
import { PASSWORD_RULE, useAuth, validPassword } from '../lib/auth';
import { PRIVACY_URL, SUPPORT_EMAIL, SUPPORT_URL, TERMS_URL } from '../lib/links';
import { enablePush, permissionState, type PermissionState } from '../lib/notifications';
import { applyScheme, colors, SCHEME_NAMES, SCHEMES, schemeName, space, themed, type SchemeName } from '../lib/theme';

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
          <Body style={{ fontWeight: '800' }}>Colour scheme</Body>
          <Small>All Comfort Colors. Pick the one you like; it sticks.</Small>
          <View style={styles.swatches}>
            {SCHEME_NAMES.map((name) => <Swatch key={name} name={name} current={schemeName()} />)}
          </View>
        </Card>

        <Card style={{ gap: 8 }}>
          <Body style={{ fontWeight: '800' }}>Change password</Body>
          <Field placeholder="new password" secureTextEntry textContentType="password" value={newPassword} onChangeText={setNewPassword} />
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

/** A little swatch: paper disc with the brand colour inside, ticked when active. */
const Swatch = ({ name, current }: { name: SchemeName; current: SchemeName }) => {
  const s = SCHEMES[name];
  const on = name === current;
  return (
    <Pressable
      onPress={() => { if (!on) { remountOnSettings(); applyScheme(name); } }}
      style={({ pressed }) => [styles.swatch, on && styles.swatchOn, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.disc, { backgroundColor: s.paper, borderColor: s.line }]}>
        <View style={[styles.dot, { backgroundColor: s.butter }]}>{on && <Icon name="check" size={14} color={s.ink} strokeWidth={3} />}</View>
      </View>
      <Small style={{ color: colors.ink }}>{s.label}</Small>
    </Pressable>
  );
};

const styles = themed((colors) => ({
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  swatch: { alignItems: 'center', gap: 4, padding: 6, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: colors.butterDeep, backgroundColor: colors.butterSoft },
  disc: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wrap: { padding: space.lg, gap: space.md, paddingBottom: 64 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: colors.blueJean, fontWeight: '800', fontSize: 15, paddingVertical: 4 },
}));
