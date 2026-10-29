import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Body, Button, Heading, Screen, Small } from '../components/ui';
import { api } from '../lib/api';
import { colors, radius, space, themed } from '../lib/theme';
import type { Group } from '../lib/types';
import type { ProfileStackParams } from '../navigation/types';

/** Your send lists. Tap one to edit it, or make a new one. */
export const GroupsScreen = () => {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParams>>();
  const [groups, setGroups] = useState<Group[] | null>(null);
  useFocusEffect(useCallback(() => { api.groups().then(setGroups).catch(() => setGroups([])); }, []));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Heading>Groups</Heading>
        <Small style={{ marginBottom: space.md }}>A group is a shortcut: pick it once and the photo goes to everyone in it.</Small>
        <Button title="New group" onPress={() => nav.navigate('GroupEdit', {})} />
        <View style={{ marginTop: space.lg, gap: 8 }}>
          {groups?.length === 0 && <Small>No groups yet.</Small>}
          {groups?.map((g) => (
            <Pressable key={g.id} onPress={() => nav.navigate('GroupEdit', { group: g })} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
              <View style={styles.stack}>
                {g.members.slice(0, 3).map((m, i) => (
                  <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -12 }}><Avatar username={m.username} size={32} /></View>
                ))}
                {g.members.length === 0 && <View style={styles.emptyAvatar}><Icon name="people" size={18} color={colors.inkSoft} /></View>}
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '800' }}>{g.name}</Body>
                <Small numberOfLines={1}>
                  {g.members.length === 0 ? 'Nobody in it yet' : g.members.map((m) => '@' + m.username).join(', ')}
                </Small>
              </View>
              <Icon name="chevron" size={20} color={colors.inkSoft} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = themed((colors) => ({
  wrap: { padding: space.lg, paddingBottom: 64 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 12, borderWidth: 2, borderColor: colors.line,
  },
  stack: { flexDirection: 'row', alignItems: 'center', minWidth: 32 },
  emptyAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
}));
