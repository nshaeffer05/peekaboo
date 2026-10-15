import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Field } from '../../components/Field';
import { Logo } from '../../components/Logo';
import { Body, Button, Screen, Small } from '../../components/ui';
import { api } from '../../lib/api';
import { PASSWORD_RULE, useAuth, validPassword, validUsername } from '../../lib/auth';
import { PRIVACY_URL, TERMS_URL } from '../../lib/links';
import { ResetScreen } from './ResetScreen';
import { colors, space, type } from '../../lib/theme';

export const AuthScreen = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [checked, setAvailable] = useState<{ u: string; ok: boolean } | null>(null);
  const available = checked && checked.u === username.trim().toLowerCase() ? checked.ok : null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [reset, setReset] = useState(false);

  useEffect(() => {
    if (mode !== 'up') return;
    const u = username.trim().toLowerCase();
    if (!validUsername(u)) return;
    let alive = true;
    const t = setTimeout(() => {
      api.usernameAvailable(u).then((ok) => alive && setAvailable({ u, ok })).catch(() => {});
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [username, mode]);

  const submit = async () => {
    setError(null);
    if (!email.includes('@')) return setError('Enter your email.');
    if (mode === 'up' && !validPassword(password)) return setError(PASSWORD_RULE);
    if (mode === 'up') {
      if (!agreed) return setError('Please confirm you are 13 or older and accept the Terms.');
      if (!validUsername(username)) return setError('Username: 3-20 letters, numbers or _');
      if (available === false) return setError('That username is taken.');
    }
    setBusy(true);
    try {
      if (mode === 'up') await signUp(email, password, username);
      else await signIn(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (reset) return <ResetScreen onDone={() => { setReset(false); setMode('in'); }} initialEmail={email} />;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Logo size={72} />
          <Text style={type.display}>Peekaboo</Text>
          <Body style={{ color: colors.inkSoft, marginBottom: space.xl }}>
            Take a photo. Send it to a friend. It disappears. That is it.
          </Body>

          <View style={styles.tabs}>
            <Button title="Sign up" small variant={mode === 'up' ? 'primary' : 'ghost'} onPress={() => setMode('up')} />
            <Button title="Sign in" small variant={mode === 'in' ? 'primary' : 'ghost'} onPress={() => setMode('in')} />
          </View>

          {mode === 'up' && (
            <>
              <Field
                placeholder="username"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                hint={username.length >= 3 && available !== null ? (available ? '@' + username + ' is yours' : 'Taken') : undefined}
                hintColor={available ? colors.moss : colors.crimson}
              />
            </>
          )}
          <Field
            placeholder="email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            placeholder={mode === 'up' ? 'password (8+, a letter and a number)' : 'password'}
            secureTextEntry
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          {mode === 'up' && (
            <Pressable onPress={() => setAgreed((a) => !a)} style={styles.agree}>
              <View style={[styles.box, agreed && styles.boxOn]}>{agreed && <Text style={styles.tick}>✓</Text>}</View>
              <Small style={{ flex: 1 }}>
                I am 13 or older and I accept the{' '}
                <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>Terms of Use</Text>
                {' '}and{' '}
                <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>.
              </Small>
            </Pressable>
          )}
          {error && <Small style={{ color: colors.crimson, marginBottom: space.sm }}>{error}</Small>}
          <Button title={mode === 'up' ? 'Create account' : 'Sign in'} onPress={submit} loading={busy} />
          {mode === 'in' && (
            <Button title="Forgot password?" variant="ghost" onPress={() => setReset(true)} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingTop: 64, gap: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: space.sm },
  agree: { flexDirection: 'row', gap: 10, alignItems: 'center', marginVertical: 4 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.butter, borderColor: colors.butterDeep },
  tick: { color: colors.ink, fontWeight: '900' },
  link: { color: colors.blueJean, fontWeight: '800' },
});
