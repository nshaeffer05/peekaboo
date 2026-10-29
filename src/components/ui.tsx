import React from 'react';
import {
  ActivityIndicator, Pressable, Text, type TextStyle, View, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, space, themed, type } from '../lib/theme';

export const Screen = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
    {children}
  </SafeAreaView>
);

export const Title = ({ children, style }: { children: React.ReactNode; style?: TextStyle }) => (
  <Text style={[type.title, style]}>{children}</Text>
);

export const Heading = ({ children, style }: { children: React.ReactNode; style?: TextStyle }) => (
  <Text style={[type.heading, style]}>{children}</Text>
);

export const Body = ({ children, style }: { children: React.ReactNode; style?: TextStyle }) => (
  <Text style={[type.body, style]}>{children}</Text>
);

export const Small = ({
  children, style, numberOfLines,
}: { children: React.ReactNode; style?: TextStyle; numberOfLines?: number }) => (
  <Text style={[type.small, style]} numberOfLines={numberOfLines}>{children}</Text>
);

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'blue';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  small?: boolean;
}

/** Primary is Butter with Pepper text: the brand button. Blue is Blue Jean with white text. */
export const Button = ({
  title, onPress, variant = 'primary', disabled, loading, style, small,
}: ButtonProps) => {
  const bg =
    variant === 'primary' ? colors.butter
    : variant === 'blue' ? colors.blueJean
    : variant === 'danger' ? colors.crimson
    : variant === 'secondary' ? colors.card
    : 'transparent';
  const fg = variant === 'blue' || variant === 'danger' ? '#fff' : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'secondary' && styles.buttonOutline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
};

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const Pill = ({ text, color = colors.butter }: { text: string; color?: string }) => (
  <View style={[styles.pill, { backgroundColor: color }]}>
    <Text style={styles.pillText}>{text}</Text>
  </View>
);

export const Centered = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.centered}>{children}</View>
);

export const inputStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.md,
  paddingHorizontal: 16,
  height: 52,
  fontSize: 16,
  color: colors.ink,
  borderWidth: 2,
  borderColor: colors.line,
} as const;

const styles = themed((colors) => ({
  screen: { flex: 1, backgroundColor: colors.paper },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
  buttonOutline: { borderWidth: 2, borderColor: colors.line },
  buttonText: { fontSize: 17, fontWeight: '800' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    ...shadow,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.ink },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
}));
