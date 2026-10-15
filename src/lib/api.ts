import { supabase } from './supabase';
import type { FriendRow, Group, InboxSnap, Profile, Relation, SearchRow, SentSnap } from './types';

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export const BUCKET = 'snaps';

export const api = {
  async myProfile(): Promise<Profile> {
    const { data, error } = await supabase.rpc('my_profile');
    fail(error);
    return data as Profile;
  },

  async usernameAvailable(u: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('username_available', { u });
    fail(error);
    return data === true;
  },

  // ---- friends
  async friends(): Promise<FriendRow[]> {
    const { data, error } = await supabase.rpc('my_friends');
    fail(error);
    return (data ?? []) as FriendRow[];
  },
  async searchProfiles(q: string): Promise<SearchRow[]> {
    const { data, error } = await supabase.rpc('search_profiles', { q });
    fail(error);
    return (data ?? []) as SearchRow[];
  },
  /** Exact username. Null when nobody has it (or they blocked you, which looks the same). */
  async lookupUsername(u: string): Promise<SearchRow | null> {
    const { data, error } = await supabase.rpc('lookup_username', { u });
    fail(error);
    const rows = (data ?? []) as SearchRow[];
    return rows[0] ?? null;
  },
  async sendFriendRequest(target: string): Promise<Relation> {
    const { data, error } = await supabase.rpc('send_friend_request', { target });
    fail(error);
    return data as Relation;
  },
  async respondFriendRequest(requester: string, accept: boolean) {
    const { error } = await supabase.rpc('respond_friend_request', { requester, accept });
    fail(error);
  },
  async removeFriend(other: string) {
    const { error } = await supabase.rpc('remove_friend', { other });
    fail(error);
  },
  async blockUser(target: string) {
    const { error } = await supabase.rpc('block_user', { target });
    fail(error);
  },
  async unblockUser(target: string) {
    const { error } = await supabase.rpc('unblock_user', { target });
    fail(error);
  },
  async myBlocks(): Promise<{ id: string; username: string }[]> {
    const { data, error } = await supabase.rpc('my_blocks');
    fail(error);
    return (data ?? []) as { id: string; username: string }[];
  },

  // ---- groups (personal send lists)
  async groups(): Promise<Group[]> {
    const { data, error } = await supabase.rpc('my_groups');
    fail(error);
    return (data ?? []) as Group[];
  },
  async saveGroup(id: string | null, name: string, members: string[]): Promise<string> {
    const { data, error } = await supabase.rpc('save_group', { group_id: id, group_name: name, members });
    fail(error);
    return data as string;
  },
  async deleteGroup(id: string) {
    const { error } = await supabase.rpc('delete_group', { group_id: id });
    fail(error);
  },

  // ---- snaps
  async sendSnap(path: string, recipients: string[], caption: string | null, captionY: number): Promise<number> {
    const { data, error } = await supabase.rpc('send_snap', { path, recipients, caption, caption_y: captionY });
    fail(error);
    return (data as number) ?? 0;
  },
  async inbox(): Promise<InboxSnap[]> {
    const { data, error } = await supabase.rpc('inbox');
    fail(error);
    return (data ?? []) as InboxSnap[];
  },
  async sent(): Promise<SentSnap[]> {
    const { data, error } = await supabase.rpc('sent_snaps');
    fail(error);
    return (data ?? []) as SentSnap[];
  },
  /** Signed, short-lived URL for a photo addressed to me. Only works before it is opened. */
  async snapUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 90);
    fail(error);
    if (!data?.signedUrl) throw new Error('That photo is gone.');
    return data.signedUrl;
  },
  /** Marks a snap opened. Returns how many other recipients still have it unopened. */
  async openSnap(id: string): Promise<number> {
    const { data, error } = await supabase.rpc('open_snap', { snap: id });
    fail(error);
    return (data as number) ?? 0;
  },
  /** Best effort: the file is deleted as soon as its last recipient has seen it. */
  async removeFile(path: string) {
    await supabase.storage.from(BUCKET).remove([path]);
  },
  async reportSnap(id: string, why: string) {
    const { error } = await supabase.rpc('report_snap', { snap: id, why });
    fail(error);
  },
  /** Sweeps my own upload folder of anything older than a day (expired, never-opened sends). */
  async sweepMyUploads(uid: string) {
    const { data } = await supabase.storage.from(BUCKET).list(uid, { limit: 200 });
    const cutoff = Date.now() - 25 * 60 * 60 * 1000;
    const old = (data ?? [])
      .filter((f) => f.created_at && new Date(f.created_at).getTime() < cutoff)
      .map((f) => `${uid}/${f.name}`);
    if (old.length) await supabase.storage.from(BUCKET).remove(old);
  },

  // ---- push
  async registerPushToken(token: string, platform: string) {
    const { error } = await supabase.rpc('register_push_token', { device_token: token, device_platform: platform });
    fail(error);
  },
  async forgetPushToken(token: string) {
    await supabase.rpc('forget_push_token', { device_token: token });
  },

  async deleteAccount() {
    const { error } = await supabase.rpc('delete_account');
    fail(error);
    await supabase.auth.signOut();
  },
};
