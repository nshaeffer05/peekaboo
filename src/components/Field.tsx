import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors, radius, themed } from '../lib/theme';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  hintColor?: string;
  right?: React.ReactNode;
}

/**
 * One text input for the whole app. Soft card, chalky outline that warms to
 * butter on focus, an optional small label above and a hint below. The whole
 * box is the tap target: tapping the padding or the icon focuses the input.
 */
export const Field = forwardRef<TextInput, Props>(({ label, hint, hintColor, right, style, ...rest }, ref) => {
  const input = useRef<TextInput>(null);
  useImperativeHandle(ref, () => input.current as TextInput);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable onPress={() => input.current?.focus()} style={[styles.box, focused && styles.boxFocus]}>
        <TextInput
          ref={input}
          placeholderTextColor={colors.dim}
          selectionColor={colors.blueJean}
          underlineColorAndroid="transparent"
          {...rest}
          style={[styles.input, style]}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        />
        {right && <View style={styles.right}>{right}</View>}
      </Pressable>
      {hint && <Text style={[styles.hint, hintColor ? { color: hintColor } : null]}>{hint}</Text>}
    </View>
  );
});
Field.displayName = 'Field';

const styles = themed((colors) => ({
  wrap: { gap: 6 },
  label: { fontSize: 12, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  box: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.line, paddingLeft: 14, minHeight: 54,
  },
  boxFocus: { borderColor: colors.butterDeep },
  input: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.ink, paddingVertical: 14, paddingRight: 14, minHeight: 50 },
  right: { paddingRight: 14, paddingLeft: 4, justifyContent: 'center' },
  hint: { fontSize: 12, fontWeight: '600', color: colors.inkSoft, marginLeft: 4 },
}));
