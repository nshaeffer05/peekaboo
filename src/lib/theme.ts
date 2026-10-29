/**
 * Comfort Colors, in several garment-dyed schemes the user can pick from in
 * Settings. `colors` is one live object: switching a scheme copies the new
 * values into it and bumps a version, and the app re-renders from the root.
 * Style sheets are built through `themed()` so they re-resolve per scheme.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet } from 'react-native';
import { useSyncExternalStore } from 'react';

export interface Palette {
  dark: boolean;
  paper: string;
  card: string;
  ink: string;
  inkSoft: string;
  line: string;
  /** The brand colour: tab bar, primary buttons, highlights. */
  butter: string;
  butterDeep: string;
  /** Tinted row background for "new" or selected items. */
  butterSoft: string;
  blueJean: string;
  denim: string;
  mint: string;
  reef: string;
  crimson: string;
  terracotta: string;
  mustard: string;
  lagoon: string;
  orchid: string;
  moss: string;
  grey: string;
  black: string;
  dim: string;
  scrim: string;
}

const accents = {
  blueJean: '#5F84AD',
  denim: '#8FA7C2',
  mint: '#CFE3D8',
  reef: '#9FD3C4',
  crimson: '#C4555F',
  terracotta: '#C8785A',
  mustard: '#DDB24C',
  lagoon: '#73AEBC',
  orchid: '#B197C8',
  moss: '#8E9B6E',
  grey: '#B7BDC1',
  black: '#1E1E1C',
  scrim: 'rgba(30,30,28,0.55)',
};

const light = {
  dark: false,
  paper: '#F3EEE3',
  card: '#FFFDF8',
  ink: '#3A3A38',
  inkSoft: '#7B7A72',
  line: '#E4DCCB',
  dim: 'rgba(58,58,56,0.45)',
  ...accents,
};

export const SCHEMES = {
  butter: { label: 'Butter', ...light, butter: '#F2DF93', butterDeep: '#E9CF6E', butterSoft: '#FBF5DC' },
  mint: { label: 'Chalky Mint', ...light, paper: '#EEF4F1', line: '#D5E2DC', butter: '#CFE3D8', butterDeep: '#A9CDBF', butterSoft: '#E7F2ED' },
  denim: { label: 'Blue Jean', ...light, paper: '#EEF1F5', line: '#D8DEE7', butter: '#A9BCD3', butterDeep: '#8FA7C2', butterSoft: '#E3EAF2' },
  orchid: { label: 'Orchid', ...light, paper: '#F3EFF6', line: '#E0D7E8', butter: '#C8B6DC', butterDeep: '#B197C8', butterSoft: '#ECE4F3' },
  terracotta: { label: 'Terracotta', ...light, paper: '#F6EEE8', line: '#E8D9CF', butter: '#E2A98F', butterDeep: '#C8785A', butterSoft: '#F5E3DA' },
  pepper: {
    label: 'Pepper', ...accents, dark: true,
    paper: '#2B2B29', card: '#383836', ink: '#F3EEE3', inkSoft: '#B7BDC1', line: '#4A4A47',
    dim: 'rgba(243,238,227,0.45)', butter: '#F2DF93', butterDeep: '#E9CF6E', butterSoft: '#4A4426',
  },
} satisfies Record<string, Palette & { label: string }>;

export type SchemeName = keyof typeof SCHEMES;
export const SCHEME_NAMES = Object.keys(SCHEMES) as SchemeName[];

const strip = (s: Palette & { label: string }): Palette => { const { label: _l, ...rest } = s; return rest; };

/** The live palette. Read it at render time, never cache it at module load. */
export const colors: Palette = { ...strip(SCHEMES.butter) };

let current: SchemeName = 'butter';
let version = 0;
const listeners = new Set<() => void>();
const STORAGE_KEY = 'scheme.v1';

export const schemeName = () => current;

export const applyScheme = (name: SchemeName, persist = true) => {
  if (!SCHEMES[name]) return;
  current = name;
  Object.assign(colors, strip(SCHEMES[name]));
  version += 1;
  listeners.forEach((l) => l());
  if (persist) void AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
};

export const loadScheme = async () => {
  try {
    const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as SchemeName | null;
    if (saved && SCHEMES[saved]) applyScheme(saved, false);
  } catch { /* default stays */ }
};

/** Re-renders the caller whenever the scheme changes. Returns [name, version]. */
export const useScheme = (): [SchemeName, number] => {
  const v = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => version,
    () => version,
  );
  return [current, v];
};

/**
 * A style sheet that follows the scheme. Reads resolve against the palette
 * in force at the time, so module-level sheets stay correct after a switch.
 */
export const themed = <T extends StyleSheet.NamedStyles<T>>(factory: (c: Palette) => T): T => {
  const cache = new Map<number, T>();
  return new Proxy({} as T, {
    get(_t, key) {
      let sheet = cache.get(version);
      if (!sheet) { sheet = StyleSheet.create(factory(colors)); cache.clear(); cache.set(version, sheet); }
      return sheet[key as keyof T];
    },
  });
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

/** Type scale. Colours are getters so they follow the scheme. */
export const type = {
  get display() { return { fontSize: 40, fontWeight: '900' as const, letterSpacing: -1, color: colors.ink }; },
  get title() { return { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.ink }; },
  get heading() { return { fontSize: 20, fontWeight: '800' as const, color: colors.ink }; },
  get body() { return { fontSize: 16, fontWeight: '500' as const, color: colors.ink }; },
  get small() { return { fontSize: 13, fontWeight: '600' as const, color: colors.inkSoft }; },
};

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
