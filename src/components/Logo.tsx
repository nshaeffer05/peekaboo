// The Peekaboo bear: a polar bear on all fours, head turned to you, cowboy hat on.
// Same drawing as the app icon (assets/bear-source.svg).
import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

export const Logo = ({ size = 72 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
<G stroke="#3A3A38" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
    <Path d="M66 66h10v16a5 5 0 01-10 0z" fill="#F3EEE3"/>
  <Path d="M78 64h10v16a5 5 0 01-10 0z" fill="#FFFDF8"/>
    <Path d="M38 50c6-8 22-11 36-9 10 1.5 17 7 17 16 0 7-5 12-12 14-10 3-28 3-38 0-6-2-9-6-9-11 0-4 2-7 6-10z" fill="#FFFDF8"/>
    <Path d="M90 56c3-.5 5 1.5 4 4" fill="#FFFDF8"/>
    <Path d="M41 67h10v16a5 5 0 01-10 0z" fill="#F3EEE3"/>
  <Path d="M53 68h10v16a5 5 0 01-10 0z" fill="#FFFDF8"/>
    <Circle cx="10" cy="45" r="6.5" fill="#FFFDF8"/>
  <Circle cx="50" cy="45" r="6.5" fill="#FFFDF8"/>
  <Circle cx="9" cy="45" r="3" fill="#F1CFC6" stroke="none"/>
  <Circle cx="51" cy="45" r="3" fill="#F1CFC6" stroke="none"/>
    <Path d="M8 50c0-12 9.5-21 22-21s22 9 22 21c0 11.5-9.5 19.5-22 19.5S8 61.5 8 50z" fill="#FFFDF8"/>
    <Path d="M17 33l2-14c0-2.5 3-4 11-4s11 1.5 11 4l2 14z" fill="#A9754F"/>
  <Path d="M19 19c3 2 19 2 22 0" fill="none"/>
  <Path d="M17.6 28h24.8v5H17.6z" fill="#5C3C28"/>
  <Path d="M2 36c5 3 15 3.5 28 3.5s23-.5 28-3.5c2.5-1.5 3-5 .5-5.5-3 0-5.5 2.5-8 3.5-5 1.5-12 2-20.5 2S14.5 35.5 9.5 34c-2.5-1-5-3.5-8-3.5-2.5.5-2 4 .5 5.5z" fill="#A9754F"/>
    <Circle cx="22" cy="49" r="2.6" fill="#3A3A38" stroke="none"/>
  <Circle cx="38" cy="49" r="2.6" fill="#3A3A38" stroke="none"/>
  <Circle cx="22.8" cy="48.2" r=".9" fill="#FFFDF8" stroke="none"/>
  <Circle cx="38.8" cy="48.2" r=".9" fill="#FFFDF8" stroke="none"/>
  <Circle cx="15.5" cy="56" r="3" fill="#F1CFC6" stroke="none"/>
  <Circle cx="44.5" cy="56" r="3" fill="#F1CFC6" stroke="none"/>
  <Ellipse cx="30" cy="59" rx="9" ry="6.5" fill="#FBF5DC"/>
  <Ellipse cx="30" cy="56.5" rx="4.2" ry="3" fill="#3A3A38" stroke="none"/>
  <Path d="M30 59.5v2.5M30 62c-1.6 2.5-4.2 2.5-5.4 1.2M30 62c1.6 2.5 4.2 2.5 5.4 1.2" fill="none"/>
</G>
  </Svg>
);
