/**
 * Comfort Colors. Every tone here is a washed, garment-dyed tee colour:
 * Ivory paper, Pepper ink, Butter for the brand, Blue Jean for links, and
 * the rest of the rack for accents. Nothing neon, nothing pure.
 */
export const colors = {
  paper: '#F3EEE3', // ivory
  card: '#FFFDF8',
  ink: '#3A3A38', // pepper
  inkSoft: '#7B7A72', // grey, darkened for text
  line: '#E4DCCB', // sandstone, light
  butter: '#F2DF93', // butter — the brand
  butterDeep: '#E9CF6E',
  blueJean: '#5F84AD', // blue jean — links and secondary actions
  denim: '#8FA7C2', // washed denim
  mint: '#CFE3D8', // chalky mint
  reef: '#9FD3C4', // island reef
  crimson: '#C4555F', // crimson
  terracotta: '#C8785A',
  mustard: '#DDB24C',
  lagoon: '#73AEBC',
  orchid: '#B197C8',
  moss: '#8E9B6E',
  grey: '#B7BDC1',
  black: '#1E1E1C', // camera chrome
  dim: 'rgba(58,58,56,0.45)',
  scrim: 'rgba(30,30,28,0.55)',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const type = {
  display: { fontSize: 40, fontWeight: '900' as const, letterSpacing: -1, color: colors.ink },
  title: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.ink },
  heading: { fontSize: 20, fontWeight: '800' as const, color: colors.ink },
  body: { fontSize: 16, fontWeight: '500' as const, color: colors.ink },
  small: { fontSize: 13, fontWeight: '600' as const, color: colors.inkSoft },
};

export const shadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
