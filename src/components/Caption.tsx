import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../lib/theme';

/** Snapchat-style caption bar: dark translucent band, white centred text. */
export const CaptionBar = ({ text, y }: { text: string; y: number }) => (
  <View style={[styles.bar, { top: y }]} pointerEvents="none">
    <Text style={styles.text}>{text}</Text>
  </View>
);

export const MAX_CAPTION = 120;

interface EditorProps {
  value: string;
  onChange: (t: string) => void;
  /** Where the bar sits as a fraction of the photo height. */
  y: number;
  onMove: (y: number) => void;
  height: number;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  /** While the keyboard is up the bar parks near the top so it is never hidden. */
  parkY: number;
}

/**
 * The same bar, but yours to move. When you are not typing it is a plain
 * label you can drag anywhere up or down the photo; a tap on it starts
 * editing. While typing it parks near the top, above the keyboard, and
 * returns to where you left it when you hit Done.
 */
export const CaptionEditor = ({ value, onChange, y, onMove, height, editing, onEdit, onDone, parkY }: EditorProps) => {
  const [barH, setBarH] = useState(48);
  const [kb, setKb] = useState(0);
  const live = useRef({ y, height, barH, onMove, onEdit });
  useEffect(() => { live.current = { y, height, barH, onMove, onEdit }; }, [y, height, barH, onMove, onEdit]);
  const start = useRef(0);
  const moved = useRef(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKb(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // The handlers only touch the refs when a gesture fires, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { start.current = live.current.y; moved.current = false; },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dy) > 3) moved.current = true;
        const { height: h, barH: b, onMove: move } = live.current;
        move(Math.min(h - b, Math.max(0, start.current * h + g.dy)) / h);
      },
      onPanResponderRelease: () => { if (!moved.current) live.current.onEdit(); },
    }),
  );

  if (editing) {
    // Keep the bar inside the visible strip above the keyboard.
    const top = Math.min(parkY, Math.max(0, height - kb - barH - 16));
    return (
      <View style={[styles.bar, { top }]} onLayout={(e) => setBarH(e.nativeEvent.layout.height)}>
        <TextInput
          style={[styles.text, styles.input]}
          value={value}
          onChangeText={(t) => onChange(t.slice(0, MAX_CAPTION))}
          autoFocus
          multiline
          maxLength={MAX_CAPTION}
          placeholder="Say something"
          placeholderTextColor="rgba(255,255,255,0.6)"
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={onDone}
          onBlur={onDone}
          selectionColor={colors.butter}
        />
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.bar, { top: Math.min(height - barH, y * height) }]}
      onLayout={(e) => setBarH(e.nativeEvent.layout.height)}
      {...pan.panHandlers}
    >
      <Text style={styles.text}>{value}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(30,30,28,0.55)',
    paddingVertical: 10, paddingHorizontal: 20, justifyContent: 'center',
  },
  text: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  input: { padding: 0, minHeight: 28 },
});
