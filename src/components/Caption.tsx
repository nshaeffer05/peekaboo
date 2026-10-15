import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TextInput, View } from 'react-native';
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
  onBlur: () => void;
  /** While the keyboard is up the bar parks near the top so it is never hidden. */
  parkY: number;
}

/**
 * The same bar, editable. Drag it up or down when not typing; it stays where
 * you leave it, and the viewer draws it at that same relative height.
 */
export const CaptionEditor = ({ value, onChange, y, onMove, height, editing, onBlur, parkY }: EditorProps) => {
  const [barH, setBarH] = useState(48);
  // The responder is created once; it reads the latest values through refs.
  const live = useRef({ y, height, barH, onMove });
  useEffect(() => { live.current = { y, height, barH, onMove }; }, [y, height, barH, onMove]);
  const start = useRef(0);
  // The handlers only touch the refs when a gesture fires, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => { start.current = live.current.y; },
      onPanResponderMove: (_e, g) => {
        const { height: h, barH: b, onMove: move } = live.current;
        move(Math.min(h - b, Math.max(0, start.current * h + g.dy)) / h);
      },
    }),
  );

  const top = editing ? parkY : Math.min(height - barH, y * height);
  return (
    <Animated.View
      style={[styles.bar, { top }]}
      onLayout={(e) => setBarH(e.nativeEvent.layout.height)}
      {...(editing ? {} : pan.panHandlers)}
    >
      <TextInput
        style={[styles.text, styles.input]}
        value={value}
        onChangeText={(t) => onChange(t.slice(0, MAX_CAPTION))}
        autoFocus={editing}
        editable={editing}
        multiline
        maxLength={MAX_CAPTION}
        placeholder="Say something"
        placeholderTextColor="rgba(255,255,255,0.6)"
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={onBlur}
        onBlur={onBlur}
        selectionColor={colors.butter}
      />
    </Animated.View>
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
