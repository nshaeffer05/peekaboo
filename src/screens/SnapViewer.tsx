import { Image } from 'expo-image';
import { usePreventScreenCapture } from 'expo-screen-capture';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaptionBar } from '../components/Caption';
import { Icon } from '../components/Icon';
import { Button, Small } from '../components/ui';
import { api } from '../lib/api';
import { useSnaps } from '../lib/snaps';
import { colors, radius, space } from '../lib/theme';
import type { InboxSnap } from '../lib/types';

const SECONDS = 11;

export interface Origin { x: number; y: number; w: number; h: number }

/**
 * Shows one photo, once, for eleven seconds. It grows out of the row you
 * tapped and shrinks back into it when it is done. The bytes are pulled
 * straight into memory as a data URL (never written to disk, never cached),
 * the row is marked opened before anything is drawn, screenshots are blocked,
 * and the file is deleted from storage once the last recipient has closed it.
 */
export const SnapViewer = ({ snap, origin, onDone }: { snap: InboxSnap; origin: Origin; onDone: () => void }) => {
  usePreventScreenCapture('viewer');
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { consume } = useSnaps();
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const remaining = useRef<number | null>(null);
  const reported = useRef(false);
  const closed = useRef(false);
  const [grow] = useState(() => new Animated.Value(0)); // 0 = the row, 1 = full screen
  const [progress] = useState(() => new Animated.Value(0));
  const [imgFade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(grow, { toValue: 1, useNativeDriver: false, damping: 18, stiffness: 160, mass: 0.9 }).start();
  }, [grow]);

  const close = () => {
    if (closed.current) return;
    closed.current = true;
    consume(snap.id);
    if (remaining.current === 0 && !reported.current) void api.removeFile(snap.image_path);
    Animated.parallel([
      Animated.timing(imgFade, { toValue: 0, duration: 120, useNativeDriver: false }),
      Animated.timing(grow, { toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
    ]).start(() => onDone());
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = await api.snapUrl(snap.image_path);
        const res = await fetch(url);
        if (!res.ok) throw new Error('That photo is gone.');
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onerror = () => reject(new Error('Could not read photo.'));
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(blob);
        });
        if (!alive) return;
        remaining.current = await api.openSnap(snap.id);
        if (!alive) return;
        setSrc(dataUrl);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => { alive = false; };
  }, [snap.id, snap.image_path]);

  useEffect(() => {
    if (!src) return;
    Animated.timing(imgFade, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    const anim = Animated.timing(progress, { toValue: 1, duration: SECONDS * 1000, easing: Easing.linear, useNativeDriver: false });
    anim.start(({ finished }) => { if (finished) close(); });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const report = () => {
    Alert.alert('Report this photo?', 'It will be kept for review instead of deleted, and we will look at it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report', style: 'destructive',
        onPress: () => {
          reported.current = true;
          api.reportSnap(snap.id, 'inappropriate').catch(() => {});
          close();
        },
      },
    ]);
  };

  const box = {
    left: grow.interpolate({ inputRange: [0, 1], outputRange: [origin.x, 0] }),
    top: grow.interpolate({ inputRange: [0, 1], outputRange: [origin.y, 0] }),
    width: grow.interpolate({ inputRange: [0, 1], outputRange: [origin.w, W] }),
    height: grow.interpolate({ inputRange: [0, 1], outputRange: [origin.h, H] }),
    borderRadius: grow.interpolate({ inputRange: [0, 1], outputRange: [radius.md, 0] }),
  };
  const chrome = grow.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: grow }]} />
      <Animated.View style={[styles.box, box]}>
        {src && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: imgFade }]}>
            <Image source={{ uri: src }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="none" />
          </Animated.View>
        )}
        {!src && !error && (
          <View style={styles.center}><ActivityIndicator color={colors.butter} size="large" /></View>
        )}
        {error && (
          <View style={[styles.center, { padding: space.xl, gap: space.md }]}>
            <Icon name="puff" size={48} color={colors.butter} />
            <Small style={{ color: colors.grey, textAlign: 'center' }}>{error}</Small>
            <Button title="Close" variant="secondary" onPress={close} />
          </View>
        )}
        {src && <Pressable style={StyleSheet.absoluteFill} onPress={close} />}
        {src && snap.caption ? <CaptionBar text={snap.caption} y={snap.caption_y * H} /> : null}

        <Animated.View style={[styles.top, { top: insets.top + 8, opacity: chrome }]}>
          <View style={styles.who}><Text style={styles.whoText}>@{snap.sender}</Text></View>
          {src && (
            <Pressable onPress={report} hitSlop={8} style={styles.flag}>
              <Icon name="flag" color={colors.card} size={20} />
            </Pressable>
          )}
        </Animated.View>
        {src && (
          <Animated.View style={[styles.track, { top: insets.top + 2, opacity: chrome }]}>
            <Animated.View style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] }) }]} />
          </Animated.View>
        )}
        {src && (
          <Animated.Text style={[styles.hint, { bottom: insets.bottom + 20, opacity: chrome }]}>
            Tap to close. Once it closes, it is gone.
          </Animated.Text>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  box: { position: 'absolute', overflow: 'hidden', backgroundColor: colors.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  who: { backgroundColor: colors.butter, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  whoText: { fontWeight: '800', color: colors.ink },
  flag: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(30,30,28,0.45)', alignItems: 'center', justifyContent: 'center' },
  track: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  fill: { height: 3, backgroundColor: colors.butter },
  hint: { position: 'absolute', alignSelf: 'center', color: colors.grey, fontSize: 13, fontWeight: '600' },
});
