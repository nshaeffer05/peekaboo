import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { Body, Card, Screen, Small, Title } from '../components/ui';
import { api } from '../lib/api';
import { colors, radius, space, themed } from '../lib/theme';
import type { Profile } from '../lib/types';
import type { ProfileStackParams } from '../navigation/types';

export const ProfileScreen = () => {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParams>>();
  const [me, setMe] = useState<Profile | null>(null);
  useFocusEffect(useCallback(() => { api.myProfile().then(setMe).catch(() => {}); }, []));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.header}>
          <Logo size={36} />
          <Title>Profile</Title>
        </View>

        <Card style={styles.hero}>
          {me ? <Avatar username={me.username} size={88} /> : <View style={{ width: 88, height: 88 }} />}
          <Title style={{ marginTop: space.sm }}>@{me?.username ?? '…'}</Title>
          <View style={styles.stats}>
            <Stat n={me?.friends ?? 0} label="friends" />
            <Stat n={me?.sent_count ?? 0} label="sent today" />
          </View>
        </Card>

        <Row icon="people" title="Friends" sub="Add people, accept requests" badge={me?.pending_in} onPress={() => nav.navigate('Friends')} />
        <Row icon="stack" title="Groups" sub="Send to a bunch of friends at once" onPress={() => nav.navigate('Groups')} />
        <Row icon="gear" title="Settings" sub="Notifications, password, account" onPress={() => nav.navigate('Settings')} />

        <Small style={{ textAlign: 'center', marginTop: space.lg }}>
          Peekaboo keeps no photos. Nothing you send or receive is stored once it has been seen.
        </Small>
      </ScrollView>
    </Screen>
  );
};

const Stat = ({ n, label }: { n: number; label: string }) => (
  <View style={{ alignItems: 'center' }}>
    <Body style={{ fontSize: 22, fontWeight: '900' }}>{n}</Body>
    <Small>{label}</Small>
  </View>
);

const Row = ({
  icon, title, sub, badge, onPress,
}: { icon: 'people' | 'gear' | 'stack'; title: string; sub: string; badge?: number; onPress: () => void }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
    <View style={styles.iconWrap}><Icon name={icon} color={colors.ink} /></View>
    <View style={{ flex: 1 }}>
      <Body style={{ fontWeight: '800' }}>{title}</Body>
      <Small>{sub}</Small>
    </View>
    {!!badge && <View style={styles.badge}><Small style={{ color: colors.ink }}>{badge}</Small></View>}
    <Icon name="chevron" size={20} color={colors.inkSoft} />
  </Pressable>
);

const styles = themed((colors) => ({
  wrap: { padding: space.lg, paddingBottom: 64, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: space.sm },
  hero: { alignItems: 'center', paddingVertical: space.lg, marginBottom: space.sm },
  stats: { flexDirection: 'row', gap: space.xl, marginTop: space.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 12, borderWidth: 2, borderColor: colors.line,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.butter, alignItems: 'center', justifyContent: 'center' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, backgroundColor: colors.butter, alignItems: 'center', justifyContent: 'center' },
}));
