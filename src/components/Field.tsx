import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors, radius } from '../lib/theme';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  hintColor?: string;
  right?: React.ReactNode;
}

/**
 * One text input for the whole app. Soft card, chalky outline that warms to
 * butter on focus, an optional small label above and a hint below.
 */
export const Field = ({ label, hint, hintColor, right, style, ...rest }: Props) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.box, focused && styles.boxFocus]}>
        <TextInput
          placeholderTextColor={colors.dim}
          selectionColor={colors.blueJean}
          {...rest}
          style={[styles.input, style]}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        />
        {right}
      </View>
      {hint && <Text style={[styles.hint, hintColor ? { color: hintColor } : null]}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 12, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  box: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.line, paddingHorizontal: 14, height: 54,
  },
  boxFocus: { borderColor: colors.butterDeep, shadowColor: colors.butterDeep, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  input: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.ink, height: '100%', paddingVertical: 0 },
  hint: { fontSize: 12, fontWeight: '600', color: colors.inkSoft, marginLeft: 4 },
});
