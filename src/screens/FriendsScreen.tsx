import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Field } from '../components/Field';
import { Icon, type IconName } from '../components/Icon';
import { Body, Button, Heading, Screen, Small } from '../components/ui';
import { api } from '../lib/api';
import { parseAddLink } from '../lib/links';
import { useSnaps } from '../lib/snaps';
import { colors, radius, space } from '../lib/theme';
import type { FriendRow, SearchRow } from '../lib/types';
import type { ProfileStackParams } from '../navigation/types';

/**
 * The whole friends story on one screen: your code, the scanner, search by
 * username, requests in, friends, requests out. Every button says exactly what
 * the server did and nothing more.
 */
export const FriendsScreen = () => {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParams>>();
  const { params } = useRoute<RouteProp<ProfileStackParams, 'Friends'>>();
  const { refresh } = useSnaps();
  const [rows, setRows] = useState<FriendRow[] | null>(null);
  const [q, setQ] = useState(() => parseAddLink(params?.username ?? params?.u ?? '') ?? '');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; good: boolean } | null>(null);
  const [fade] = useState(() => new Animated.Value(0));

  const load = useCallback(async () => {
    try { setRows(await api.friends()); } catch (e) { console.warn(e); }
    void refresh();
  }, [refresh]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Arriving again through a link while already mounted.
  const linked = parseAddLink(params?.username ?? params?.u ?? '');
  const [lastLinked, setLastLinked] = useState(linked);
  if (linked && linked !== lastLinked) { setLastLinked(linked); setQ(linked); }

  const say = useCallback((text: string, good = true) => {
    setNotice({ text, good });
    fade.setValue(0);
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) setNotice(null); });
  }, [fade]);

  // Search as you type. A pasted link or @name resolves to that exact person.
  useEffect(() => {
    const needle = (parseAddLink(q) ?? q.trim().toLowerCase()).replace(/[^a-z0-9_]/g, '');
    if (needle.length < 2) return;
    let alive = true;
    const t = setTimeout(() => {
      setSearching(true);
      api.searchProfiles(needle)
        .then((r) => alive && setResults(r))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setSearching(false));
    }, 220);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  const add = async (r: SearchRow) => {
    setBusyId(r.id);
    try {
      const rel = await api.sendFriendRequest(r.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResults((rs) => rs.map((x) => (x.id === r.id ? { ...x, relation: rel } : x)));
      say(rel === 'friends' ? `You and @${r.username} are now friends.` : `Request sent to @${r.username}.`);
      void load();
    } catch (e) {
      say((e as Error).message, false);
    } finally {
      setBusyId(null);
    }
  };

  const respond = async (f: FriendRow, accept: boolean) => {
    setBusyId(f.id);
    try {
      await api.respondFriendRequest(f.id, accept);
      if (accept) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      say(accept ? `You and @${f.username} are now friends.` : `Declined @${f.username}.`);
      await load();
    } catch (e) {
      say((e as Error).message, false);
    } finally {
      setBusyId(null);
    }
  };

  const cancelRequest = async (f: FriendRow) => {
    setBusyId(f.id);
    try { await api.removeFriend(f.id); say(`Request to @${f.username} withdrawn.`); await load(); }
    catch (e) { say((e as Error).message, false); }
    finally { setBusyId(null); }
  };

  const manage = (f: FriendRow) =>
    Alert.alert(`@${f.username}`, 'Friends can send you photos and get yours.', [
      {
        text: 'Remove friend',
        onPress: () => api.removeFriend(f.id).then(() => { say(`Removed @${f.username}.`); void load(); }).catch((e) => say(e.message, false)),
      },
      {
        text: 'Block', style: 'destructive',
        onPress: () => Alert.alert(`Block @${f.username}?`, 'They will not be able to find you, add you, or send you anything. You can undo this in Settings.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: () => api.blockUser(f.id).then(() => { say(`Blocked @${f.username}.`); void load(); }).catch((e) => say(e.message, false)) },
        ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const active = q.trim().length >= 2;
  const incoming = (rows ?? []).filter((r) => r.status === 'pending' && r.direction === 'in');
  const outgoing = (rows ?? []).filter((r) => r.status === 'pending' && r.direction === 'out');
  const friends = (rows ?? []).filter((r) => r.status === 'accepted');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Heading>Friends</Heading>
        <Small style={{ marginBottom: space.md }}>Only friends can send you photos, and you can only send to friends.</Small>

        <View style={styles.actions}>
          <Action icon="puff" title="My code" sub="Show your QR" onPress={() => nav.navigate('MyCode')} />
          <Action icon="camera" title="Scan" sub="Add from a QR" onPress={() => nav.navigate('Scan')} />
        </View>

        <Field
          placeholder="Add by username"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          value={q}
          onChangeText={setQ}
          right={q ? (
            <Pressable onPress={() => setQ('')} hitSlop={8}><Icon name="x" size={18} color={colors.inkSoft} /></Pressable>
          ) : <Icon name="people" size={20} color={colors.inkSoft} />}
        />

        {active && (
          <View style={styles.section}>
            {searching && results.length === 0 && <Small>Looking…</Small>}
            {!searching && results.length === 0 && <Small>No one named “{q.trim()}”. Usernames are letters, numbers and _.</Small>}
            {results.map((r) => (
              <Row key={r.id} username={r.username}>
                {r.relation === 'none' && <Button title="Add" small onPress={() => add(r)} loading={busyId === r.id} />}
                {r.relation === 'pending_out' && <Small>Requested</Small>}
                {r.relation === 'pending_in' && <Button title="Accept" small onPress={() => add(r)} loading={busyId === r.id} />}
                {r.relation === 'friends' && <Small style={{ color: colors.moss }}>Friends ✓</Small>}
              </Row>
            ))}
          </View>
        )}

        {incoming.length > 0 && (
          <View style={styles.section}>
            <Small style={styles.label}>Requests · {incoming.length}</Small>
            {incoming.map((f) => (
              <Row key={f.id} username={f.username} highlight>
                <Button title="Accept" small onPress={() => respond(f, true)} loading={busyId === f.id} />
                <Button title="Decline" small variant="ghost" onPress={() => respond(f, false)} disabled={busyId === f.id} />
              </Row>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Small style={styles.label}>Your friends · {friends.length}</Small>
          {rows === null && <Small>Loading…</Small>}
          {rows !== null && friends.length === 0 && (
            <Small>Nobody yet. Show your code, scan a friend&apos;s, or search a username above.</Small>
          )}
          {friends.map((f) => (
            <Pressable key={f.id} onPress={() => manage(f)}>
              <Row username={f.username}><Icon name="chevron" size={18} color={colors.inkSoft} /></Row>
            </Pressable>
          ))}
        </View>

        {outgoing.length > 0 && (
          <View style={styles.section}>
            <Small style={styles.label}>Waiting on them · {outgoing.length}</Small>
            {outgoing.map((f) => (
              <Row key={f.id} username={f.username}>
                <Button title="Withdraw" small variant="ghost" onPress={() => cancelRequest(f)} loading={busyId === f.id} />
              </Row>
            ))}
          </View>
        )}
      </ScrollView>

      {notice && (
        <Animated.View style={[styles.notice, { opacity: fade, backgroundColor: notice.good ? colors.butter : colors.crimson }]} pointerEvents="none">
          <Icon name={notice.good ? 'check' : 'x'} size={18} color={notice.good ? colors.ink : '#fff'} strokeWidth={3} />
          <Body style={{ fontWeight: '800', color: notice.good ? colors.ink : '#fff', flex: 1 }}>{notice.text}</Body>
        </Animated.View>
      )}
    </Screen>
  );
};

const Action = ({ icon, title, sub, onPress }: { icon: IconName; title: string; sub: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
    <View style={styles.actionIcon}><Icon name={icon} color={colors.ink} /></View>
    <Body style={{ fontWeight: '800' }}>{title}</Body>
    <Small>{sub}</Small>
  </Pressable>
);

const Row = ({ username, highlight, children }: { username: string; highlight?: boolean; children?: React.ReactNode }) => (
  <View style={[styles.row, highlight && styles.rowHi]}>
    <Avatar username={username} size={40} />
    <Body style={{ flex: 1, fontWeight: '800' }}>@{username}</Body>
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingBottom: 64 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: space.md },
  action: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 2, borderColor: colors.line,
    padding: 14, gap: 2,
  },
  actionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.butter, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  section: { marginTop: space.lg, gap: 8 },
  label: { textTransform: 'uppercase', letterSpacing: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 12, borderWidth: 2, borderColor: colors.line,
  },
  rowHi: { borderColor: colors.butterDeep, backgroundColor: '#FBF5DC' },
  notice: {
    position: 'absolute', left: 16, right: 16, bottom: 24, flexDirection: 'row', gap: 10, alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.md,
  },
});
