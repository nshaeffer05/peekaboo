import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Field } from '../../components/Field';
import { Body, Button, Screen, Small, Title } from '../../components/ui';
import { PASSWORD_RULE, useAuth, validPassword } from '../../lib/auth';
import { colors, space } from '../../lib/theme';

/**
 * Password reset by emailed code. A link could never come back into this
 * app reliably, so the email carries a code and the app does the rest:
 * verifyOtp(recovery) signs the user in, updateUser sets the password.
 */
export const ResetScreen = ({ onDone, initialEmail }: { onDone: () => void; initialEmail: string }) => {
  const { requestReset, confirmReset } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setError(null);
    if (!email.includes('@')) return setError('Enter your email.');
    setBusy(true);
    try { await requestReset(email); setSent(true); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const finish = async () => {
    setError(null);
    if (code.trim().length < 6) return setError('Enter the code from the email.');
    if (!validPassword(password)) return setError(PASSWORD_RULE);
    setBusy(true);
    try { await confirmReset(email, code, password); onDone(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Title>Reset password</Title>
          {!sent ? (
            <>
              <Body style={{ color: colors.inkSoft }}>We will email you a code.</Body>
              <Field placeholder="email" autoCapitalize="none"
                autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} />
              {error && <Small style={{ color: colors.crimson }}>{error}</Small>}
              <Button title="Send code" onPress={send} loading={busy} />
            </>
          ) : (
            <>
              <Body style={{ color: colors.inkSoft }}>Check {email} for a code. It lasts an hour.</Body>
              <Field style={styles.code} placeholder="code"
                keyboardType="number-pad" textContentType="oneTimeCode" value={code} onChangeText={setCode} />
              <Field placeholder="new password (8+, a letter and a number)"
                secureTextEntry textContentType="password" value={password} onChangeText={setPassword} />
              {error && <Small style={{ color: colors.crimson }}>{error}</Small>}
              <Button title="Set new password" onPress={finish} loading={busy} />
              <Button title="Send another code" variant="ghost" onPress={send} />
            </>
          )}
          <Button title="Back to sign in" variant="ghost" onPress={onDone} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingTop: 64, gap: 12 },
  code: { fontSize: 24, fontWeight: '800', letterSpacing: 4, textAlign: 'center' },
});
