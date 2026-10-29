import React from 'react';
import { Text, View } from 'react-native';
import { colors, themed } from '../lib/theme';

const palette = () => [colors.mint, colors.reef, colors.denim, colors.orchid, colors.terracotta, colors.mustard, colors.lagoon, colors.moss];

/** Initial on a garment-dyed circle. The colour is picked from the username, so it is stable. */
export const Avatar = ({ username, size = 40 }: { username: string; size?: number }) => {
  let h = 0;
  for (const c of username) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const p = palette();
  const bg = p[h % p.length];
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{username.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
};

const styles = themed((colors) => ({
  wrap: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card },
  letter: { fontWeight: '900', color: colors.ink },
}));
