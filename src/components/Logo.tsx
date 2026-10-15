// The Peekaboo puff: a soft cloud that has just gone up in smoke.
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../lib/theme';

export const Logo = ({ size = 72, ink = colors.ink, fill = colors.butter }: { size?: number; ink?: string; fill?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Path
      d="M30 72c-9 0-15-6-14.6-13.6.3-6.8 5.2-11.6 12-12.4C29 33 38.6 25.4 50 25.8c9.6.4 17.2 6.4 20 15.2 8.4.4 14 6 13.6 14.4-.4 9.2-7.2 15.6-16.4 15.6H30z"
      fill={fill} stroke={ink} strokeWidth="5" strokeLinejoin="round"
    />
    <Circle cx="39" cy="84" r="2.6" fill={ink} />
    <Circle cx="51" cy="87" r="2.6" fill={ink} />
    <Circle cx="63" cy="83.5" r="2.6" fill={ink} />
    <Path d="M41 50v2M59 49v2" stroke={ink} strokeWidth="5" strokeLinecap="round" />
    <Path d="M43 59c3.6 3.2 10 3.2 14 0" stroke={ink} strokeWidth="4.5" strokeLinecap="round" />
  </Svg>
);
