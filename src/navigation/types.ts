import type { Group } from '../lib/types';

export type ProfileStackParams = {
  Profile: undefined;
  Friends: { username?: string; u?: string } | undefined;
  MyCode: undefined;
  Scan: undefined;
  Groups: undefined;
  GroupEdit: { group?: Group };
  Settings: undefined;
};

export type TabParams = {
  Feed: undefined;
  Camera: undefined;
  ProfileTab: undefined;
};
