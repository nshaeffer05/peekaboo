import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { Body, Button, Heading, Screen, Small } from '../components/ui';
import { api } from '../lib/api';
import { colors, radius, space } from '../lib/theme';
import type { FriendRow } from '../lib/types';
import type { ProfileStackParams } from '../navigation/types';

/** Name a group and tick the friends in it. */
export const GroupEditScreen = () => {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParams>>();
  const { params } = useRoute<RouteProp<ProfileStackParams, 'GroupEdit'>>();
  const existing = params?.group ?? null;
  const [name, setName] = useState(existing?.name ?? '');
  const [chosen, setChosen] = useState<Set<string>>(new Set(existing?.members.map((m) => m.id) ?? []));
  const [friends, setFriends] = useState<FriendRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.friends().then((r) => setFriends(r.filter((f) => f.status === 'accepted'))).catch(() => setFriends([]));
  }, []);

  const toggle = (id: string) =>
    setChosen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const save = async () => {
    if (!name.trim()) return Alert.alert('Name it', 'Give the group a name.');
    setBusy(true);
    try { await api.saveGroup(existing?.id ?? null, name, [...chosen]); nav.goBack(); }
    catch (e) { Alert.alert('Could not save', (e as Error).message); }
    finally { setBusy(false); }
  };

  const remove = () =>
    Alert.alert('Delete this group?', 'Only the shortcut goes. Your friends stay your friends.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => existing && api.deleteGroup(existing.id).then(() => nav.goBack()) },
    ]);

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Heading style={{ marginBottom: space.md }}>{existing ? 'Edit group' : 'New group'}</Heading>
          <Field label="Name" placeholder="e.g. roommates" value={name} onChangeText={(t) => setName(t.slice(0, 30))} autoCorrect={false} maxLength={30} />

          <Small style={{ ...styles.label, marginTop: space.lg }}>Who is in it · {chosen.size}</Small>
          {friends?.length === 0 && <Small>Add some friends first.</Small>}
          <View style={{ gap: 6 }}>
            {friends?.map((f) => {
              const on = chosen.has(f.id);
              return (
                <Pressable key={f.id} onPress={() => toggle(f.id)} style={({ pressed }) => [styles.row, on && styles.rowOn, pressed && { opacity: 0.85 }]}>
                  <Avatar username={f.username} size={36} />
                  <Body style={{ flex: 1, fontWeight: '800' }}>@{f.username}</Body>
                  <View style={[styles.tick, on && styles.tickOn]}>{on && <Icon name="check" size={16} color={colors.ink} strokeWidth={3} />}</View>
                </Pressable>
              );
            })}
          </View>

          <Button title={existing ? 'Save' : 'Create group'} onPress={save} loading={busy} style={{ marginTop: space.lg }} />
          {existing && <Button title="Delete group" variant="ghost" onPress={remove} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingBottom: 64 },
  label: { textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 10, borderWidth: 2, borderColor: colors.line,
  },
  rowOn: { borderColor: colors.butterDeep, backgroundColor: '#FBF5DC' },
  tick: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: colors.butter, borderColor: colors.butterDeep },
});
