// Hand-drawn line icons. Every path is a little wobbly on purpose.
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../lib/theme';

export type IconName =
  | 'face' | 'camera' | 'inbox' | 'people' | 'gear' | 'check' | 'x' | 'chevron'
  | 'flip' | 'bolt' | 'boltOff' | 'send' | 'flag' | 'eye' | 'puff' | 'plus' | 'stack' | 'mailbox' | 'bearHat' | 'bearTophat';

const GLYPHS: Record<IconName, React.ReactNode> = {
  face: (
    <>
      <Path d="M12 3.2c5 0 8.8 3.9 8.6 8.9-.2 4.8-3.9 8.7-8.7 8.7S3.3 16.7 3.4 12 7 3.2 12 3.2z" />
      <Path d="M9 10.1v1M15 9.8v1" />
      <Path d="M8.6 14.3c1.8 1.9 5 1.9 6.9-.1" />
    </>
  ),
  camera: (
    <>
      <Path d="M3.6 8.4c0-1 .8-1.8 1.8-1.8h2.4l1.3-2.2h5.8l1.3 2.2h2.4c1 0 1.8.8 1.8 1.8v8.9c0 1-.8 1.8-1.8 1.8H5.4c-1 0-1.8-.8-1.8-1.8V8.4z" />
      <Circle cx="12" cy="12.6" r="3.4" />
    </>
  ),
  inbox: (
    <>
      <Path d="M4 5.5h16v13H4z" />
      <Path d="M4 13h4.6c.3 1.6 1.6 2.6 3.4 2.6s3.1-1 3.4-2.6H20" />
    </>
  ),
  people: (
    <>
      <Path d="M9 11.5a3.3 3.3 0 100-6.6 3.3 3.3 0 000 6.6z" />
      <Path d="M3 20c.3-3.6 2.8-5.6 6-5.6s5.7 2 6 5.6" />
      <Path d="M16 11a2.8 2.8 0 100-5.6 2.8 2.8 0 000 5.6z" />
      <Path d="M17.5 14.6c2.2.5 3.5 2.4 3.5 5.4" />
    </>
  ),
  gear: (
    <>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3M6 6l1.6 1.6M16.4 16.4L18 18M6 18l1.6-1.6M16.4 7.6L18 6" />
    </>
  ),
  check: <Path d="M5 12.5l4.2 4.3L19 7.2" />,
  x: <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  chevron: <Path d="M9 5.5l6.3 6.5L9 18.5" />,
  flip: (
    <>
      <Path d="M4.5 10.5a7.6 7.6 0 0113.6-3.4" />
      <Path d="M18 4.2v3.4h-3.4" />
      <Path d="M19.5 13.5a7.6 7.6 0 01-13.6 3.4" />
      <Path d="M6 19.8v-3.4h3.4" />
    </>
  ),
  bolt: <Path d="M13.2 2.8L5.6 13.3h5.2l-1.6 7.9 7.9-10.6h-5.2l1.3-7.8z" />,
  boltOff: (
    <>
      <Path d="M13.2 2.8L5.6 13.3h5.2l-1.6 7.9 7.9-10.6h-5.2l1.3-7.8z" />
      <Path d="M4 4l16 16" />
    </>
  ),
  send: (
    <>
      <Path d="M3.8 11.6L20 4.4l-5.2 15.8-3.2-6.8z" />
      <Path d="M11.6 13.4L20 4.4" />
    </>
  ),
  flag: (
    <>
      <Path d="M6 21V4.2" />
      <Path d="M6 4.6c3-1.6 5.6 1.4 8.8-.2L18 3.8v9.4l-3.2.6c-3.2 1.6-5.8-1.4-8.8.2" />
    </>
  ),
  eye: (
    <>
      <Path d="M2.8 12c2.4-4 5.5-6 9.2-6s6.8 2 9.2 6c-2.4 4-5.5 6-9.2 6s-6.8-2-9.2-6z" />
      <Circle cx="12" cy="12" r="2.8" />
    </>
  ),
  puff: (
    <>
      <Path d="M7.2 17.5c-2.3 0-3.8-1.5-3.7-3.4.1-1.7 1.3-2.9 3-3.1C7 8 9.4 6.1 12.2 6.2c2.4.1 4.3 1.6 5 3.8 2.1.1 3.5 1.5 3.4 3.6-.1 2.3-1.8 3.9-4.1 3.9H7.2z" />
      <Path d="M9.5 20.5h.1M12.5 21.2h.1M15.6 20.3h.1" />
    </>
  ),
  plus: <Path d="M12 5.5v13M5.5 12h13" />,
  // A little roadside mailbox: rounded body, post, flag up.
  mailbox: (
    <>
      <Path d="M3.6 11.2c0-2.7 1.9-4.7 4.4-4.7h8.2c2.5 0 4.3 2.1 4.2 4.7l-.1 5.3H3.7z" />
      <Path d="M8 6.5c-2.4.1-4.2 2.1-4.3 4.7M12.6 16.4V11c0-2.6-1.9-4.5-4.4-4.5" />
      <Path d="M16.8 6.5V2.8h3.4v2.7h-3.3" />
      <Path d="M9.2 16.6v4.6M6.6 21.3h5.2" />
    </>
  ),
  // The Peekaboo bear from the side, top hat on, looking at you.
  bearTophat: (
    <>
      <Path d="M12.3 10.8c3.4-1.5 7.2-1.1 9 1.1 1.6 1.9 1.3 4.9-.7 6.2-2.2 1.4-5.6 1.7-8.2.9" />
      <Path d="M15.2 19.1v2.2M18.6 18.7v2.6M21.4 17.2v3.3" />
      <Path d="M2.3 14.3a5.3 5.3 0 1110.6 0 5.3 5.3 0 01-10.6 0z" />
      <Path d="M4.7 9.3V4.8h5.8v4.5" />
      <Path d="M2.6 9.5h10" />
      <Path d="M5.7 13.7v.2M9.5 13.7v.2" />
      <Path d="M7.6 15.4c-.7 0-1.2.3-1.2.6s.5.6 1.2.6 1.2-.3 1.2-.6-.5-.6-1.2-.6zM7.6 16.6v.8" />
    </>
  ),
  // Polar bear in an ushanka: fur hat with ear flaps down, round face below.
  bearHat: (
    <>
      <Path d="M6.9 10.1c.4-3.6 2.4-5.7 5.1-5.7s4.7 2.1 5.1 5.7" />
      <Path d="M5.2 10.4c2.2-1.1 11.4-1.1 13.6 0 .6.3.6 1.2-.2 1.3-2.4.5-10.8.5-13.2 0-.8-.1-.8-1-.2-1.3z" />
      <Path d="M6 11.9c-.6 1.5-.8 2.9-.5 4.3M18 11.9c.6 1.5.8 2.9.5 4.3" />
      <Path d="M6.6 12.3c-.4 5 2 9.2 5.4 9.2s5.8-4.2 5.4-9.2" />
      <Path d="M9.9 15.2v.2M14.1 15.2v.2" />
      <Path d="M12 17.3c-.9 0-1.5.4-1.5.9s.6.8 1.5.8 1.5-.3 1.5-.8-.6-.9-1.5-.9z" />
      <Path d="M12 19v.9" />
    </>
  ),
  stack: (
    <>
      <Path d="M12 3.6l8.4 4.6-8.4 4.6-8.4-4.6z" />
      <Path d="M3.8 12.3l8.2 4.5 8.2-4.5" />
      <Path d="M3.8 16.3l8.2 4.5 8.2-4.5" />
    </>
  ),
};

export const Icon = ({
  name, size = 24, color = colors.ink, strokeWidth = 2,
}: { name: IconName; size?: number; color?: string; strokeWidth?: number }) => (
  <Svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
  >
    {GLYPHS[name]}
  </Svg>
);
