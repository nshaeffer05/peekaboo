import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, username: string): Promise<void>;
  signOut(): Promise<void>;
  requestReset(email: string): Promise<void>;
  confirmReset(email: string, code: string, password: string): Promise<void>;
  changePassword(password: string): Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(friendly(error.message));
    },
    async signUp(email, password, username) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: username.trim().toLowerCase() } },
      });
      if (error) throw new Error(friendly(error.message));
      if (!data.session) {
        throw new Error('Check your email to confirm your account, then sign in.');
      }
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async requestReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw new Error(friendly(error.message));
    },
    async confirmReset(email, code, password) {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
      if (error) throw new Error(/expired|invalid/i.test(error.message) ? 'That code is wrong or has expired.' : error.message);
      const { error: e2 } = await supabase.auth.updateUser({ password });
      if (e2) throw new Error(friendly(e2.message));
    },
    async changePassword(password) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(friendly(error.message));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
};

const friendly = (m: string) => {
  if (/invalid login credentials/i.test(m)) return 'Wrong email or password.';
  if (/already registered/i.test(m)) return 'That email already has an account.';
  if (/password/i.test(m) && /short|least/i.test(m)) return 'Password needs at least 8 characters.';
  return m;
};

export const validUsername = (u: string) => /^[a-z0-9_]{3,20}$/.test(u.trim().toLowerCase());

/** 8+ characters with at least one letter and one digit. Mirrors the server setting. */
export const PASSWORD_RULE = 'At least 8 characters with a letter and a number.';
export const validPassword = (p: string) => p.length >= 8 && /[a-zA-Z]/.test(p) && /[0-9]/.test(p);
