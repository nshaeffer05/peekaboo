import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { Body, Button, Screen, Small, Title } from '../components/ui';
import { timeAgo, timeLeft, useSnaps } from '../lib/snaps';
import { colors, radius, space, themed } from '../lib/theme';
import type { InboxSnap } from '../lib/types';
import type { TabParams } from '../navigation/types';
import { type Origin, SnapViewer } from './SnapViewer';

export const FeedScreen = () => {
  const nav = useNavigation<BottomTabNavigationProp<TabParams>>();
  const { inbox, sent, loading, refresh } = useSnaps();
  const [viewing, setViewing] = useState<{ snap: InboxSnap; origin: Origin } | null>(null);
  const rowRefs = useRef<Record<string, View | null>>({});

  // The viewer grows out of the row that was tapped, so measure it first.
  const open = (s: InboxSnap) => {
    const el = rowRefs.current[s.id];
    const fallback: Origin = { x: 24, y: 200, w: 300, h: 70 };
    if (!el) return setViewing({ snap: s, origin: fallback });
    el.measureInWindow((x, y, w, h) => setViewing({ snap: s, origin: w && h ? { x, y, w, h } : fallback }));
  };
  const [refreshing, setRefreshing] = useState(false);

  const pull = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.wrap}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pull} tintColor={colors.blueJean} />}
      >
        <View style={styles.header}>
          <Logo size={36} />
          <Title>Feed</Title>
        </View>

        {!loading && inbox.length === 0 && (
          <View style={styles.empty}>
            <Icon name="puff" size={40} color={colors.butterDeep} />
            <Body style={{ fontWeight: '800', marginTop: space.sm }}>Nothing new</Body>
            <Small style={{ textAlign: 'center', marginTop: 4, marginBottom: space.md }}>
              Photos your friends send you show up here. Open one and it is gone for good.
            </Small>
            <Button title="Take a photo" small onPress={() => nav.navigate('Camera')} />
          </View>
        )}

        {inbox.map((s) => (
          <Pressable
            key={s.id}
            ref={(el) => { rowRefs.current[s.id] = el; }}
            onPress={() => open(s)}
            style={({ pressed }) => [styles.row, styles.rowNew, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <Avatar username={s.sender} size={44} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '800' }}>@{s.sender}</Body>
              <Small>Tap to open · {timeAgo(s.created_at)} · {timeLeft(s.expires_at)}</Small>
            </View>
            <View style={styles.badge}><Icon name="eye" size={18} color={colors.ink} /></View>
          </Pressable>
        ))}

        {sent.length > 0 && (
          <View style={{ marginTop: space.lg, gap: 8 }}>
            <Small style={styles.label}>Sent</Small>
            {sent.map((s) => (
              <View key={s.id} style={styles.row}>
                <Avatar username={s.recipient} size={36} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '700' }}>@{s.recipient}</Body>
                  <Small>{s.opened_at ? `Opened ${timeAgo(s.opened_at)}` : `Delivered · ${timeAgo(s.created_at)}`}</Small>
                </View>
                <View style={[styles.dot, { backgroundColor: s.opened_at ? colors.line : colors.reef }]} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      {viewing && <SnapViewer snap={viewing.snap} origin={viewing.origin} onDone={() => setViewing(null)} />}
    </Screen>
  );
};

const styles = themed((colors) => ({
  wrap: { padding: space.lg, paddingBottom: 64, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: space.sm },
  empty: { alignItems: 'center', padding: space.lg, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 12, borderWidth: 2, borderColor: colors.line,
  },
  rowNew: { borderColor: colors.butterDeep, backgroundColor: colors.butterSoft },
  badge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.butter, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { textTransform: 'uppercase', letterSpacing: 1 },
}));
