-- Captions: a line of text laid over the photo, Snapchat style. Stored with
-- the row and drawn by the viewer at the same relative height, so the photo
-- itself is never re-encoded. Safe to re-run.

alter table public.snaps add column if not exists caption text check (length(caption) <= 120);
alter table public.snaps add column if not exists caption_y real not null default 0.5 check (caption_y between 0 and 1);
alter table public.reports add column if not exists caption text;

drop function if exists public.send_snap(text, uuid[]);
create or replace function public.send_snap(path text, recipients uuid[], caption text default null, caption_y real default 0.5)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  r uuid;
  n integer := 0;
  cap text := nullif(left(btrim(coalesce(caption, '')), 120), '');
  cy real := least(1, greatest(0, coalesce(caption_y, 0.5)));
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
    insert into public.snaps (sender_id, recipient_id, image_path, caption, caption_y) values (me, r, path, cap, cy);
    n := n + 1;
  end loop;
  if n = 0 then
    delete from storage.objects where bucket_id = 'snaps' and name = path;
    raise exception 'None of those people are your friends.' using errcode = '22023';
  end if;
  return n;
end;
$$;
grant execute on function public.send_snap(text, uuid[], text, real) to authenticated;

drop function if exists public.inbox();
create or replace function public.inbox()
returns table (id uuid, sender_id uuid, sender text, image_path text, created_at timestamptz, expires_at timestamptz, caption text, caption_y real)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.sender_id, p.username, s.image_path, s.created_at, s.expires_at, s.caption, s.caption_y
  from public.snaps s join public.profiles p on p.id = s.sender_id
  where s.recipient_id = auth.uid() and s.opened_at is null and s.expires_at > now()
    and not public.blocked_between(auth.uid(), s.sender_id)
  order by s.created_at asc;
$$;
grant execute on function public.inbox() to authenticated;

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
  insert into public.reports (reporter_id, snap_id, sender_id, image_path, caption, reason)
  values (auth.uid(), snap, s.sender_id, s.image_path, s.caption, left(coalesce(why, ''), 500));
end;
$$;
