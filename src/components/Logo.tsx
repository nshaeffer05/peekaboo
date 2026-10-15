// The Peekaboo bear: a polar bear in a cowboy hat. Same drawing as the app icon.
import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

const INK = '#3A3A38';
const FUR = '#FFFDF8';
const PINK = '#F1CFC6';
const HAT = '#A9754F';
const BAND = '#5C3C28';

export const Logo = ({ size = 72 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <G stroke={INK} strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round">
      <Circle cx="23" cy="51" r="9" fill={FUR} />
      <Circle cx="77" cy="51" r="9" fill={FUR} />
      <Circle cx="22" cy="51" r="4" fill={PINK} stroke="none" />
      <Circle cx="78" cy="51" r="4" fill={PINK} stroke="none" />
      <Path d="M22 62c0-16 12.5-27 28-27s28 11 28 27c0 15-12.5 25-28 25S22 77 22 62z" fill={FUR} />
      <Path d="M33 42l2.5-19c0-3 4-5 14.5-5s14.5 2 14.5 5L67 42z" fill={HAT} />
      <Path d="M35.5 23c4 2.5 25 2.5 29 0" />
      <Path d="M33.8 36h32.4v6H33.8z" fill={BAND} />
      <Path d="M12 44c6 4 20 4.5 38 4.5s32-.5 38-4.5c3-2 4-6 1-6.5-4 0-7 3-10 4-6 2-16 2.5-29 2.5S27 43.5 21 41.5c-3-1-6-4-10-4-3 .5-2 4.5 1 6.5z" fill={HAT} />
      <Circle cx="40" cy="60" r="3" fill={INK} stroke="none" />
      <Circle cx="60" cy="60" r="3" fill={INK} stroke="none" />
      <Circle cx="41" cy="59" r="1" fill={FUR} stroke="none" />
      <Circle cx="61" cy="59" r="1" fill={FUR} stroke="none" />
      <Circle cx="33" cy="68" r="3.5" fill={PINK} stroke="none" />
      <Circle cx="67" cy="68" r="3.5" fill={PINK} stroke="none" />
      <Ellipse cx="50" cy="72" rx="11" ry="8" fill="#FBF5DC" />
      <Ellipse cx="50" cy="68.5" rx="5" ry="3.5" fill={INK} stroke="none" />
      <Path d="M50 72v3M50 75c-2 3-5 3-6.5 1.5M50 75c2 3 5 3 6.5 1.5" />
    </G>
  </Svg>
);
