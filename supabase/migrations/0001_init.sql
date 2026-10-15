-- Peekaboo: schema, security, push, and the sweep that makes photos disappear.
--
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- The app in one paragraph: you take a photo and send it to friends. Each
-- recipient can open it once, for eleven seconds, and then it is gone. Unopened
-- photos vanish after a day. The sender never sees the photo again either.
-- The only thing kept past that is a "sent / opened" line for a day, with
-- no image attached, and reported photos, which are held for review.

set lock_timeout = '5s';

create extension if not exists pg_cron;
create extension if not exists pg_net;
grant usage on schema cron to postgres;

-- ---------------------------------------------------------------- profiles

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$')
);
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  u text := lower(btrim(coalesce(new.raw_user_meta_data->>'username', '')));
begin
  if u !~ '^[a-z0-9_]{3,20}$' then
    u := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  if exists (select 1 from public.profiles where username = u) then
    u := left(u, 15) || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;
  insert into public.profiles (id, username) values (new.id, u);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.username_available(u text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(btrim(u)) ~ '^[a-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles where username = lower(btrim(u)));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- ---------------------------------------------------------------- friends & blocks

create table if not exists public.friendships (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);
alter table public.friendships enable row level security;

drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships
  for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.blocks enable row level security;
drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select to authenticated using (blocker_id = auth.uid());

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b) or (f.requester_id = b and f.addressee_id = a))
  );
$$;

create or replace function public.blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;


-- ---------------------------------------------------------------- groups
-- A group is a personal send list: a name and some friends. Only the owner
-- sees it; recipients just get the photo.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 30),
  created_at timestamptz not null default now()
);
create index if not exists groups_owner_idx on public.groups (owner_id);
alter table public.groups enable row level security;
drop policy if exists groups_select_own on public.groups;
create policy groups_select_own on public.groups for select to authenticated using (owner_id = auth.uid());

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;

create or replace function public.my_groups()
returns table (id uuid, name text, members jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'username', p.username) order by p.username)
      from public.group_members m join public.profiles p on p.id = m.user_id
      where m.group_id = g.id and public.are_friends(auth.uid(), p.id) and not public.blocked_between(auth.uid(), p.id)
    ), '[]'::jsonb)
  from public.groups g
  where g.owner_id = auth.uid()
  order by lower(g.name);
$$;
grant execute on function public.my_groups() to authenticated;

create or replace function public.save_group(group_id uuid, group_name text, members uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  gid uuid := group_id;
  n text := btrim(coalesce(group_name, ''));
begin
  if me is null then raise exception 'Not signed in.' using errcode = '28000'; end if;
  if length(n) < 1 or length(n) > 30 then raise exception 'Give the group a name (up to 30 characters).' using errcode = '22023'; end if;
  if gid is null then
    if (select count(*) from public.groups where owner_id = me) >= 50 then
      raise exception 'That is plenty of groups.' using errcode = '22023';
    end if;
    insert into public.groups (owner_id, name) values (me, n) returning id into gid;
  else
    update public.groups set name = n where id = gid and owner_id = me;
    if not found then raise exception 'No such group.' using errcode = '22023'; end if;
    delete from public.group_members where group_members.group_id = gid;
  end if;
  insert into public.group_members (group_id, user_id)
  select gid, x from unnest(coalesce(members, '{}'::uuid[])) x
  where x <> me and public.are_friends(me, x) and not public.blocked_between(me, x)
  on conflict do nothing;
  return gid;
end;
$$;
grant execute on function public.save_group(uuid, text, uuid[]) to authenticated;

create or replace function public.delete_group(group_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.groups where id = group_id and owner_id = auth.uid();
$$;
grant execute on function public.delete_group(uuid) to authenticated;

-- ---------------------------------------------------------------- snaps

create table if not exists public.snaps (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  image_path text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  opened_at timestamptz,
  reported boolean not null default false,
  check (sender_id <> recipient_id)
);
create index if not exists snaps_recipient_idx on public.snaps (recipient_id, opened_at, expires_at);
create index if not exists snaps_sender_idx on public.snaps (sender_id, created_at desc);
create index if not exists snaps_path_idx on public.snaps (image_path);
alter table public.snaps enable row level security;

-- Readable by both ends so Realtime can deliver changes. All writes go through RPCs.
drop policy if exists snaps_select on public.snaps;
create policy snaps_select on public.snaps
  for select to authenticated
  using (recipient_id = auth.uid() or sender_id = auth.uid());

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  snap_id uuid references public.snaps (id) on delete set null,
  sender_id uuid references public.profiles (id) on delete set null,
  image_path text,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;

-- ---------------------------------------------------------------- storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('snaps', 'snaps', false, 3145728, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Upload into your own folder only.
drop policy if exists snaps_upload_own on storage.objects;
create policy snaps_upload_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'snaps' and (storage.foldername(name))[1] = auth.uid()::text);

-- Read only if it is addressed to you and you have not opened it yet.
-- The sender cannot read it back: once sent, it is out of their hands.
drop policy if exists snaps_read_unopened on storage.objects;
create policy snaps_read_unopened on storage.objects
  for select to authenticated
  using (
    bucket_id = 'snaps'
    and exists (
      select 1 from public.snaps s
      where s.image_path = name and s.recipient_id = auth.uid()
        and s.opened_at is null and s.expires_at > now()
    )
  );

-- Delete: the sender may clean their own folder (listing needs select, which
-- the owner policy below grants on the folder itself); a recipient may delete
-- a file addressed to them once every recipient has opened it.
drop policy if exists snaps_list_own on storage.objects;
create policy snaps_list_own on storage.objects
  for select to authenticated
  using (bucket_id = 'snaps' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists snaps_delete on storage.objects;
create policy snaps_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'snaps'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        exists (select 1 from public.snaps s where s.image_path = name and s.recipient_id = auth.uid())
        and not exists (select 1 from public.snaps s where s.image_path = name and s.opened_at is null)
        and not exists (select 1 from public.snaps s where s.image_path = name and s.reported)
      )
    )
  );

-- ---------------------------------------------------------------- push tokens

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null default 'ios',
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;

create or replace function public.register_push_token(device_token text, device_platform text default 'ios')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not signed in.' using errcode = '28000'; end if;
  if device_token is null or btrim(device_token) = '' then
    raise exception 'A device token is required.' using errcode = '22023';
  end if;
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (btrim(device_token), auth.uid(), device_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;
grant execute on function public.register_push_token(text, text) to authenticated;

create or replace function public.forget_push_token(device_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_tokens where token = btrim(device_token) and user_id = auth.uid();
$$;
grant execute on function public.forget_push_token(text) to authenticated;

-- Expo's push API accepts a plain POST, so a trigger can notify directly.
create or replace function public.notify_new_snap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender text;
  msgs jsonb;
begin
  select username into sender from public.profiles where id = new.sender_id;
  select jsonb_agg(jsonb_build_object(
    'to', t.token, 'title', 'Peekaboo', 'body', '@' || sender || ' sent you a photo',
    'sound', 'default', 'channelId', 'snaps', 'data', jsonb_build_object('snap', new.id)
  )) into msgs
  from public.push_tokens t where t.user_id = new.recipient_id;
  if msgs is not null then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
      body := msgs
    );
  end if;
  return new;
end;
$$;

drop trigger if exists snaps_notify on public.snaps;
create trigger snaps_notify
  after insert on public.snaps
  for each row execute function public.notify_new_snap();

-- ---------------------------------------------------------------- profile & friend RPCs

create or replace function public.my_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'created_at', p.created_at,
    'friends', (select count(*) from public.friendships f
                 where f.status = 'accepted' and (f.requester_id = p.id or f.addressee_id = p.id)),
    'pending_in', (select count(*) from public.friendships f
                    where f.status = 'pending' and f.addressee_id = p.id),
    'sent_count', (select count(*) from public.snaps s where s.sender_id = p.id and s.created_at > now() - interval '24 hours')
  )
  from public.profiles p where p.id = auth.uid();
$$;
grant execute on function public.my_profile() to authenticated;

create or replace function public.search_profiles(q text)
returns table (id uuid, username text, relation text)
language sql
stable
security definer
set search_path = public
as $$
  with needle as (select lower(btrim(q)) as v)
  select p.id, p.username,
    case
      when public.are_friends(auth.uid(), p.id) then 'friends'
      when exists (select 1 from public.friendships f where f.status = 'pending'
                    and f.requester_id = auth.uid() and f.addressee_id = p.id) then 'pending_out'
      when exists (select 1 from public.friendships f where f.status = 'pending'
                    and f.requester_id = p.id and f.addressee_id = auth.uid()) then 'pending_in'
      else 'none'
    end
  from public.profiles p, needle
  where length(needle.v) >= 2
    and p.id <> auth.uid()
    and p.username like needle.v || '%'
    and not public.blocked_between(auth.uid(), p.id)
  order by p.username
  limit 20;
$$;
grant execute on function public.search_profiles(text) to authenticated;


-- Exact lookup, used by the QR scanner and by "add by username".
create or replace function public.lookup_username(u text)
returns table (id uuid, username text, relation text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username,
    case
      when p.id = auth.uid() then 'self'
      when public.are_friends(auth.uid(), p.id) then 'friends'
      when exists (select 1 from public.friendships f where f.status = 'pending'
                    and f.requester_id = auth.uid() and f.addressee_id = p.id) then 'pending_out'
      when exists (select 1 from public.friendships f where f.status = 'pending'
                    and f.requester_id = p.id and f.addressee_id = auth.uid()) then 'pending_in'
      else 'none'
    end
  from public.profiles p
  where p.username = lower(btrim(u))
    and not public.blocked_between(auth.uid(), p.id)
  limit 1;
$$;
grant execute on function public.lookup_username(text) to authenticated;

create or replace function public.send_friend_request(target uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in.' using errcode = '28000'; end if;
  if target = me then raise exception 'That is you.' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'No such person.' using errcode = '22023';
  end if;
  if public.blocked_between(me, target) then raise exception 'Cannot add this person.' using errcode = '42501'; end if;
  if public.are_friends(me, target) then return 'friends'; end if;
  if exists (select 1 from public.friendships where requester_id = target and addressee_id = me and status = 'pending') then
    update public.friendships set status = 'accepted', responded_at = now()
     where requester_id = target and addressee_id = me;
    return 'friends';
  end if;
  insert into public.friendships (requester_id, addressee_id, status)
  values (me, target, 'pending')
  on conflict (requester_id, addressee_id) do nothing;
  return 'pending_out';
end;
$$;
grant execute on function public.send_friend_request(uuid) to authenticated;

create or replace function public.respond_friend_request(requester uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if accept then
    update public.friendships set status = 'accepted', responded_at = now()
     where requester_id = requester and addressee_id = auth.uid() and status = 'pending';
  else
    delete from public.friendships
     where requester_id = requester and addressee_id = auth.uid() and status = 'pending';
  end if;
end;
$$;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

create or replace function public.remove_friend(other uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.friendships
   where (requester_id = auth.uid() and addressee_id = other)
      or (requester_id = other and addressee_id = auth.uid());
$$;
grant execute on function public.remove_friend(uuid) to authenticated;

create or replace function public.my_friends()
returns table (id uuid, username text, status text, direction text, since timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username, f.status,
         case when f.requester_id = auth.uid() then 'out' else 'in' end,
         coalesce(f.responded_at, f.created_at)
  from public.friendships f
  join public.profiles p on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
    and not public.blocked_between(auth.uid(), p.id)
  order by f.status, p.username;
$$;
grant execute on function public.my_friends() to authenticated;

create or replace function public.block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target = auth.uid() then return; end if;
  insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), target) on conflict do nothing;
  perform public.remove_friend(target);
  -- Anything they sent me that I have not opened goes away too.
  delete from public.snaps where sender_id = target and recipient_id = auth.uid() and opened_at is null and not reported;
end;
$$;
grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.blocks where blocker_id = auth.uid() and blocked_id = target;
$$;
grant execute on function public.unblock_user(uuid) to authenticated;

create or replace function public.my_blocks()
returns table (id uuid, username text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username from public.blocks b join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid() order by p.username;
$$;
grant execute on function public.my_blocks() to authenticated;

-- ---------------------------------------------------------------- snap RPCs

-- One upload, one row per recipient. Only friends, never blocked, never yourself.
create or replace function public.send_snap(path text, recipients uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r uuid;
  n integer := 0;
begin
  if me is null then raise exception 'Not signed in.' using errcode = '28000'; end if;
  if path is null or split_part(path, '/', 1) <> me::text then
    raise exception 'That is not your upload.' using errcode = '42501';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'snaps' and name = path) then
    raise exception 'Upload the photo first.' using errcode = '22023';
  end if;
  if recipients is null or array_length(recipients, 1) is null then
    raise exception 'Pick someone to send to.' using errcode = '22023';
  end if;
  if array_length(recipients, 1) > 50 then
    raise exception 'Too many recipients.' using errcode = '22023';
  end if;
  foreach r in array (select array_agg(distinct x) from unnest(recipients) x) loop
    if r = me then continue; end if;
    if not public.are_friends(me, r) or public.blocked_between(me, r) then continue; end if;
    insert into public.snaps (sender_id, recipient_id, image_path) values (me, r, path);
    n := n + 1;
  end loop;
  if n = 0 then
    delete from storage.objects where bucket_id = 'snaps' and name = path;
    raise exception 'None of those people are your friends.' using errcode = '22023';
  end if;
  return n;
end;
$$;
grant execute on function public.send_snap(text, uuid[]) to authenticated;

create or replace function public.inbox()
returns table (id uuid, sender_id uuid, sender text, image_path text, created_at timestamptz, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.sender_id, p.username, s.image_path, s.created_at, s.expires_at
  from public.snaps s join public.profiles p on p.id = s.sender_id
  where s.recipient_id = auth.uid() and s.opened_at is null and s.expires_at > now()
    and not public.blocked_between(auth.uid(), s.sender_id)
  order by s.created_at asc;
$$;
grant execute on function public.inbox() to authenticated;

create or replace function public.sent_snaps()
returns table (id uuid, recipient_id uuid, recipient text, created_at timestamptz, opened_at timestamptz, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.recipient_id, p.username, s.created_at, s.opened_at, s.expires_at
  from public.snaps s join public.profiles p on p.id = s.recipient_id
  where s.sender_id = auth.uid() and s.created_at > now() - interval '24 hours'
  order by s.created_at desc
  limit 100;
$$;
grant execute on function public.sent_snaps() to authenticated;

-- Marks it opened (once). Returns how many other recipients still have the
-- same file unopened, so the client knows whether to delete the file.
create or replace function public.open_snap(snap uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  p text;
  n integer;
begin
  update public.snaps set opened_at = now()
   where id = snap and recipient_id = auth.uid() and opened_at is null and expires_at > now()
   returning image_path into p;
  if p is null then raise exception 'That photo is gone.' using errcode = '22023'; end if;
  select count(*) into n from public.snaps where image_path = p and opened_at is null;
  return n;
end;
$$;
grant execute on function public.open_snap(uuid) to authenticated;

-- Reported photos are held, not deleted, so there is something to review.
create or replace function public.report_snap(snap uuid, why text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.snaps;
begin
  select * into s from public.snaps where id = snap and recipient_id = auth.uid();
  if s.id is null then return; end if;
  update public.snaps set reported = true, expires_at = greatest(expires_at, now() + interval '30 days') where id = snap;
  insert into public.reports (reporter_id, snap_id, sender_id, image_path, reason)
  values (auth.uid(), snap, s.sender_id, s.image_path, left(coalesce(why, ''), 500));
end;
$$;
grant execute on function public.report_snap(uuid, text) to authenticated;

-- Apple requires in-app account deletion.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in.' using errcode = '28000'; end if;
  delete from storage.objects where bucket_id = 'snaps' and (storage.foldername(name))[1] = me::text;
  delete from auth.users where id = me;
end;
$$;
grant execute on function public.delete_account() to authenticated;

-- ---------------------------------------------------------------- the sweep

-- Every ten minutes: drop expired rows and rows that were opened over a day
-- ago (the "opened" line on the sender's feed only lasts a day), then drop
-- any file nobody can open any more. Reported rows and files stay.
create or replace function public.sweep_snaps()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.snaps
   where not reported
     and (expires_at < now() or (opened_at is not null and opened_at < now() - interval '24 hours'));
  delete from storage.objects o
   where o.bucket_id = 'snaps'
     and o.created_at < now() - interval '1 hour'
     and not exists (select 1 from public.snaps s where s.image_path = o.name and (s.opened_at is null or s.reported));
end;
$$;

do $$
begin
  perform cron.unschedule('peekaboo_sweep');
exception when others then null;
end $$;
select cron.schedule('peekaboo_sweep', '*/10 * * * *', $$select public.sweep_snaps();$$);

-- ---------------------------------------------------------------- realtime

do $$
begin
  alter publication supabase_realtime add table public.snaps;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.friendships;
exception when duplicate_object then null;
end $$;
