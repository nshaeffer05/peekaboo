import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api } from './api';
import { useAuth } from './auth';
import { supabase } from './supabase';
import type { InboxSnap, SentSnap } from './types';

interface SnapsState {
  inbox: InboxSnap[];
  sent: SentSnap[];
  /** Friend requests waiting on me. Drives the Profile tab badge. */
  requests: number;
  loading: boolean;
  refresh(): Promise<void>;
  /** Drops a snap from the local inbox right away (it was just opened). */
  consume(id: string): void;
}

const Ctx = createContext<SnapsState | null>(null);

/**
 * One subscription for the whole app: new rows addressed to me land in the
 * inbox instantly; updates to rows I sent flip them to "opened".
 */
export const SnapsProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [inbox, setInbox] = useState<InboxSnap[]>([]);
  const [sent, setSent] = useState<SentSnap[]>([]);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [i, s, p] = await Promise.all([api.inbox(), api.sent(), api.myProfile()]);
      setInbox(i);
      setSent(s);
      setRequests(p.pending_in);
    } catch (e) {
      console.warn('refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime payloads do not carry usernames, so a change just schedules a reload.
  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void refresh(); }, 150);
  }, [refresh]);

  useEffect(() => {
    if (!uid) return;
    schedule();
    void api.sweepMyUploads(uid);
    const channel = supabase
      .channel(`snaps:${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'snaps', filter: `recipient_id=eq.${uid}` }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'snaps', filter: `sender_id=eq.${uid}` }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${uid}` }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${uid}` }, schedule)
      .subscribe();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void refresh(); });
    return () => {
      sub.remove();
      void supabase.removeChannel(channel);
    };
  }, [uid, refresh, schedule]);

  const consume = useCallback((id: string) => setInbox((rows) => rows.filter((r) => r.id !== id)), []);

  return <Ctx.Provider value={{ inbox, sent, requests, loading, refresh, consume }}>{children}</Ctx.Provider>;
};

export const useSnaps = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSnaps outside SnapsProvider');
  return v;
};

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const timeLeft = (iso: string) => {
  const s = Math.max(0, (new Date(iso).getTime() - Date.now()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m left`;
  return `${Math.floor(s / 3600)}h left`;
};
