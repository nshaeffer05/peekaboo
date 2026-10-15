# Peekaboo

Take a photo, send it to friends, it shows once for eleven seconds, then it is gone.
No chat, no gallery, no saving, no screenshots.

Expo SDK 57 + Supabase. Same stack as Doodleoff and Quotebook.

## Run

```bash
cp .env.example .env.local   # fill in EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
npx expo start
```

Camera, QR scanning and screenshot blocking all work in Expo Go. Push notifications need a dev build or TestFlight.

## Backend

`supabase/migrations/0001_init.sql` is the whole backend. Paste it into the SQL editor; it is safe to re-run.

- **Storage** bucket `snaps`, private, JPEG only, 3 MB cap. Upload into your own folder; read only if it is addressed to you and unopened.
- **`send_snap(path, recipients[])`** one upload, one row per friend. A trigger POSTs to Expo's push API through `pg_net`.
- **`open_snap(id)`** marks it opened and returns how many other recipients still have it; the client deletes the file when that hits zero.
- **`sweep_snaps()`** on `pg_cron` every ten minutes removes expired rows and orphaned files. Reported photos are held 30 days.
- **Realtime** on `snaps` and `friendships` keeps the feed and the request badge live.

## Checks

```bash
npx tsc --noEmit && npx expo lint
```
