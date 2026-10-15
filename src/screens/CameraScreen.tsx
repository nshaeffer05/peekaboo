import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { usePreventScreenCapture } from 'expo-screen-capture';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { CaptionEditor } from '../components/Caption';
import { Icon } from '../components/Icon';
import { Body, Button, Centered, Heading, Small } from '../components/ui';
import { api, BUCKET } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useSnaps } from '../lib/snaps';
import { supabase } from '../lib/supabase';
import { colors, radius, space } from '../lib/theme';
import type { FriendRow, Group } from '../lib/types';

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/**
 * Take a photo, pick who gets it, send. The only place a photo of yours ever
 * exists is the preview on this screen; it is resized, uploaded, and the
 * local file is deleted the moment the send goes through.
 */
export const CameraScreen = () => {
  usePreventScreenCapture('camera');
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useSnaps();
  const [permission, requestPermission] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [shot, setShot] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [captionY, setCaptionY] = useState(0.5);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const { height: H } = useWindowDimensions();
  const lastTap = useRef(0);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const snap = async () => {
    if (!ready || !cam.current) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cam.current.takePictureAsync({ quality: 0.9, exif: false, shutterSound: false });
      setShot(photo.uri);
    } catch (e) {
      Alert.alert('Could not take photo', (e as Error).message);
    }
  };

  const discard = useCallback(() => {
    if (shot) { try { new File(shot).delete(); } catch { /* temp file, best effort */ } }
    setShot(null);
    setPicking(false);
    setCaption('');
    setCaptionY(0.5);
    setEditing(false);
  }, [shot]);

  // Double-tap anywhere on the viewfinder flips the camera.
  const onViewfinderTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      setFacing((f) => (f === 'back' ? 'front' : 'back'));
      void Haptics.selectionAsync();
    } else {
      lastTap.current = now;
    }
  };

  const stopEditing = () => { setEditing(false); Keyboard.dismiss(); };

  const send = async (recipients: string[]) => {
    if (!shot || !session) return;
    setSending(true);
    try {
      const ctx = ImageManipulator.manipulate(shot);
      ctx.resize({ width: 1080 });
      const rendered = await ctx.renderAsync();
      const small = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.72 });
      const bytes = await new File(small.uri).arrayBuffer();
      try { new File(small.uri).delete(); } catch { /* best effort */ }
      const path = `${session.user.id}/${uuid()}.jpg`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
      if (error) throw new Error(error.message);
      const n = await api.sendSnap(path, recipients, caption.trim() || null, captionY);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast(n === 1 ? 'Sent' : `Sent to ${n}`);
      discard();
      void refresh();
    } catch (e) {
      Alert.alert('Could not send', (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (!permission) return <View style={styles.black} />;
  if (!permission.granted) {
    return (
      <View style={[styles.black, { paddingTop: insets.top }]}>
        <Centered>
          <Icon name="camera" size={48} color={colors.butter} />
          <Heading style={{ color: colors.card, marginTop: space.md, textAlign: 'center' }}>Peekaboo needs the camera</Heading>
          <Small style={{ color: colors.grey, textAlign: 'center', marginVertical: space.md }}>
            That is the whole app: take a photo, send it, and it is gone.
          </Small>
          {permission.canAskAgain
            ? <Button title="Allow camera" onPress={() => void requestPermission()} />
            : <Button title="Open Settings" variant="secondary" onPress={() => void Linking.openSettings()} />}
        </Centered>
      </View>
    );
  }

  if (shot) {
    return (
      <View style={styles.black}>
        <Image source={{ uri: shot }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="none" />
        {/* Tap the photo: start a caption if there is none, otherwise finish editing. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => (editing ? stopEditing() : !caption && setEditing(true))} />
        {(editing || caption.length > 0) && (
          <CaptionEditor
            value={caption}
            onChange={setCaption}
            y={captionY}
            onMove={setCaptionY}
            height={H}
            editing={editing}
            onBlur={stopEditing}
            parkY={insets.top + 72}
          />
        )}
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Round onPress={discard}><Icon name="x" color={colors.card} /></Round>
          <Round onPress={() => (editing ? stopEditing() : setEditing(true))}>
            <Text style={[styles.aa, editing && { color: colors.butter }]}>Aa</Text>
          </Round>
        </View>
        {!editing && <View style={[styles.bottomBar, { bottom: insets.bottom + 16 }]}>
          <Pressable onPress={() => setPicking(true)} style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.sendText}>Send to</Text>
            <Icon name="send" color={colors.ink} size={22} />
          </Pressable>
        </View>}
        <Picker visible={picking} onClose={() => setPicking(false)} onSend={send} sending={sending} />
      </View>
    );
  }

  return (
    <View style={styles.black}>
      <CameraView
        ref={cam}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mirror={facing === 'front'}
        animateShutter={false}
        onCameraReady={() => setReady(true)}
      />
      <Pressable style={StyleSheet.absoluteFill} onPress={onViewfinderTap} />
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Round onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}>
          <Icon name={flash === 'on' ? 'bolt' : 'boltOff'} color={flash === 'on' ? colors.butter : colors.card} />
        </Round>
        <Round onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
          <Icon name="flip" color={colors.card} />
        </Round>
      </View>
      <View style={[styles.bottomBar, { bottom: insets.bottom + 16 }]}>
        <Pressable onPress={snap} style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.92 }] }]}>
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
      {toast && (
        <View style={[styles.toast, { top: insets.top + 64 }]}>
          <Icon name="puff" size={18} color={colors.ink} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
};

const Round = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
  <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.round, pressed && { opacity: 0.7 }]}>
    {children}
  </Pressable>
);

/** Bottom sheet listing friends. Multi-select, then one Send. */
const Picker = ({
  visible, onClose, onSend, sending,
}: { visible: boolean; onClose: () => void; onSend: (ids: string[]) => void; sending: boolean }) => {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<FriendRow[] | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) return;
    Promise.all([api.friends(), api.groups().catch(() => [] as Group[])])
      .then(([r, g]) => {
        setChosen(new Set());
        setRows(r.filter((f) => f.status === 'accepted'));
        setGroups(g.filter((x) => x.members.length > 0));
      })
      .catch(() => setRows([]));
  }, [visible]);

  const toggle = (id: string) =>
    setChosen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  // A group chip is "on" when everyone in it is picked. Tapping it picks or unpicks all of them.
  const groupOn = (g: Group) => g.members.every((m) => chosen.has(m.id));
  const toggleGroup = (g: Group) =>
    setChosen((s) => {
      const n = new Set(s);
      if (g.members.every((m) => n.has(m.id))) g.members.forEach((m) => n.delete(m.id));
      else g.members.forEach((m) => n.add(m.id));
      return n;
    });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.grip} />
        <Heading style={{ marginBottom: space.sm }}>Send to</Heading>
        {rows === null && <ActivityIndicator color={colors.blueJean} style={{ marginVertical: space.lg }} />}
        {rows?.length === 0 && (
          <Small style={{ marginVertical: space.md }}>No friends yet. Add some from your profile first.</Small>
        )}
        {groups.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
            {groups.map((g) => {
              const on = groupOn(g);
              return (
                <Pressable key={g.id} onPress={() => toggleGroup(g)} style={[styles.chip, on && styles.chipOn]}>
                  <Icon name="stack" size={16} color={colors.ink} />
                  <Text style={styles.chipText}>{g.name} · {g.members.length}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 6 }}>
          {rows?.map((f) => {
            const on = chosen.has(f.id);
            return (
              <Pressable key={f.id} onPress={() => toggle(f.id)} style={[styles.friend, on && styles.friendOn]}>
                <Avatar username={f.username} size={36} />
                <Body style={{ flex: 1, fontWeight: '800' }}>@{f.username}</Body>
                <View style={[styles.tick, on && styles.tickOn]}>{on && <Icon name="check" size={16} color={colors.ink} strokeWidth={3} />}</View>
              </Pressable>
            );
          })}
        </ScrollView>
        <Button
          title={chosen.size === 0 ? 'Pick someone' : chosen.size === 1 ? 'Send' : `Send to ${chosen.size}`}
          onPress={() => onSend([...chosen])}
          disabled={chosen.size === 0}
          loading={sending}
          style={{ marginTop: space.md }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: colors.black },
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  bottomBar: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  round: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(30,30,28,0.45)',
  },
  shutter: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: colors.butter,
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.butter,
    paddingVertical: 14, paddingHorizontal: 26, borderRadius: radius.pill,
  },
  sendText: { fontSize: 18, fontWeight: '800', color: colors.ink },
  aa: { fontSize: 17, fontWeight: '900', color: colors.card },
  toast: {
    position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: colors.butter, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill,
  },
  toastText: { fontWeight: '800', color: colors.ink },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.paper, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: space.lg, paddingTop: space.sm,
  },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: space.md },
  friend: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 10, borderWidth: 2, borderColor: colors.line,
  },
  friendOn: { borderColor: colors.butterDeep, backgroundColor: '#FBF5DC' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.butter, borderColor: colors.butterDeep },
  chipText: { fontWeight: '800', color: colors.ink, fontSize: 13 },
  tick: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: colors.butter, borderColor: colors.butterDeep },
});
