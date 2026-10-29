import React, { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Avatar } from '../components/Avatar';
import { Logo } from '../components/Logo';
import { Body, Button, Card, Heading, Screen, Small } from '../components/ui';
import { api } from '../lib/api';
import { addLink } from '../lib/links';
import { colors, radius, space, themed } from '../lib/theme';

/** Your QR code. A friend scans it from their Friends screen and you get a request. */
export const MyCodeScreen = () => {
  const [username, setUsername] = useState<string | null>(null);
  useEffect(() => { api.myProfile().then((p) => setUsername(p.username)).catch(() => {}); }, []);

  const share = () => {
    if (!username) return;
    void Share.share({ message: `Add me on Peekaboo: @${username}\n${addLink(username)}` });
  };

  return (
    <Screen>
      <View style={styles.wrap}>
        <Heading>My code</Heading>
        <Small style={{ marginBottom: space.lg }}>Let a friend scan this from their Friends screen, or share the link.</Small>
        <Card style={styles.card}>
          <View style={styles.qrWrap}>
            {username && (
              <QRCode
                value={addLink(username)}
                size={220}
                color={colors.ink}
                backgroundColor={colors.card}
                ecl="M"
                logo={undefined}
              />
            )}
            <View style={styles.logoBadge}><Logo size={44} /></View>
          </View>
          <View style={styles.who}>
            {username && <Avatar username={username} size={32} />}
            <Body style={{ fontWeight: '900', fontSize: 18 }}>@{username ?? '…'}</Body>
          </View>
        </Card>
        <Button title="Share my link" variant="blue" onPress={share} disabled={!username} style={{ marginTop: space.lg }} />
      </View>
    </Screen>
  );
};

const styles = themed((colors) => ({
  wrap: { padding: space.lg, flex: 1 },
  card: { alignItems: 'center', paddingVertical: space.xl, backgroundColor: colors.card, borderWidth: 3, borderColor: colors.butter },
  qrWrap: { padding: 12, backgroundColor: colors.card, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  logoBadge: {
    position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -30, width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.card,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.md },
}));
