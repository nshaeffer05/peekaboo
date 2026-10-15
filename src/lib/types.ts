export interface Profile {
  id: string;
  username: string;
  created_at: string;
  friends: number;
  pending_in: number;
  sent_count: number;
}

export type Relation = 'none' | 'pending_out' | 'pending_in' | 'friends' | 'self';

export interface SearchRow {
  id: string;
  username: string;
  relation: Relation;
}

export interface FriendRow {
  id: string;
  username: string;
  status: 'pending' | 'accepted';
  direction: 'in' | 'out';
  since: string;
}

/** A photo someone sent me that I have not opened yet. */
export interface InboxSnap {
  id: string;
  sender_id: string;
  sender: string;
  image_path: string;
  created_at: string;
  expires_at: string;
  caption: string | null;
  caption_y: number;
}

/** A photo I sent, kept (without the file) for a day so I can see if it was opened. */
export interface SentSnap {
  id: string;
  recipient_id: string;
  recipient: string;
  created_at: string;
  opened_at: string | null;
  expires_at: string;
}

export interface Group {
  id: string;
  name: string;
  members: { id: string; username: string }[];
}
