import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Body, Button, Centered, Heading, Small } from '../components/ui';
import { api } from '../lib/api';
import { parseAddLink } from '../lib/links';
import { colors, radius, space } from '../lib/theme';
import type { ProfileStackParams } from '../navigation/types';
import type { Relation, SearchRow } from '../lib/types';

type Found = { row: SearchRow } | { missing: string } | null;

/** Point the camera at a friend's code. Confirm, and the request goes out. */
export const ScanScreen = () => {
  const nav = useNavigation<NativeStackNavigationProp<ProfileStackParams>>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [found, setFound] = useState<Found>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const lock = useRef(false);

  const onScan = async ({ data }: BarcodeScanningResult) => {
    if (lock.current) return;
    const u = parseAddLink(data);
    if (!u) return;
    lock.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const row = await api.lookupUsername(u);
      setFound(row ? { row } : { missing: u });
    } catch {
      setFound({ missing: u });
    }
  };

  const again = () => { setFound(null); setDone(null); lock.current = false; };

  const add = async (row: SearchRow) => {
    setBusy(true);
    try {
      const rel: Relation = await api.sendFriendRequest(row.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(rel === 'friends' ? `You and @${row.username} are now friends.` : `Request sent to @${row.username}.`);
    } catch (e) {
      setDone((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!permission) return <View style={styles.black} />;
  if (!permission.granted) {
    return (
      <View style={[styles.black, { paddingTop: insets.top + 56 }]}>
        <Centered>
          <Icon name="camera" size={48} color={colors.butter} />
          <Heading style={{ color: colors.card, marginTop: space.md }}>Camera needed to scan</Heading>
          <View style={{ height: space.md }} />
          {permission.canAskAgain
            ? <Button title="Allow camera" onPress={() => void requestPermission()} />
            : <Button title="Open Settings" variant="secondary" onPress={() => void Linking.openSettings()} />}
        </Centered>
      </View>
    );
  }

  return (
    <View style={styles.black}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={found ? undefined : onScan}
      />
      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Point at a friend&apos;s code</Text>
      </View>

      {found && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {'missing' in found ? (
            <>
              <Heading>Nobody named @{found.missing}</Heading>
              <Small style={{ marginVertical: space.sm }}>That code does not match anyone on Peekaboo.</Small>
              <Button title="Scan again" onPress={again} />
            </>
          ) : done ? (
            <>
              <Body style={{ fontWeight: '800', fontSize: 18 }}>{done}</Body>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: space.md }}>
                <Button title="Scan another" variant="secondary" onPress={again} style={{ flex: 1 }} />
                <Button title="Done" onPress={() => nav.goBack()} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar username={found.row.username} size={48} />
                <View style={{ flex: 1 }}>
                  <Heading>@{found.row.username}</Heading>
                  <Small>{label(found.row.relation)}</Small>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: space.md }}>
                <Button title="Cancel" variant="secondary" onPress={again} style={{ flex: 1 }} />
                {found.row.relation === 'none' && <Button title="Send request" onPress={() => add(found.row)} loading={busy} style={{ flex: 1 }} />}
                {found.row.relation === 'pending_in' && <Button title="Accept" onPress={() => add(found.row)} loading={busy} style={{ flex: 1 }} />}
                {(found.row.relation === 'friends' || found.row.relation === 'pending_out' || found.row.relation === 'self') && (
                  <Button title="Done" onPress={() => nav.goBack()} style={{ flex: 1 }} />
                )}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const label = (r: Relation) =>
  r === 'friends' ? 'Already friends'
  : r === 'pending_out' ? 'You already sent them a request'
  : r === 'pending_in' ? 'They already asked to be your friend'
  : r === 'self' ? 'That is your own code'
  : 'Not friends yet';

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: colors.black },
  frameWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: space.md },
  frame: { width: 240, height: 240, borderRadius: radius.lg, borderWidth: 4, borderColor: colors.butter },
  hint: { color: colors.card, fontWeight: '800' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.paper,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg,
  },
});
