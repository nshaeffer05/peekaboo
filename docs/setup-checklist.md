# Peekaboo: the five things still to do by hand

Everything else is done: code (tsc + lint clean), icons, Supabase project `yvelonsocenhyvwtmryi`,
migration applied, EAS project linked, legal pages written in `docs/site/`.

## 1. Supabase Auth settings
Dashboard → Authentication → Sign In / Providers
- Turn **Confirm email** OFF (sign-up signs you straight in; app expects a session).
- Under Email provider: minimum password length **8**, required characters **letters and digits**.

## 2. Resend SMTP
Resend → API keys → Create API key, name `peekaboo`, Sending access, copy it.
Dashboard → Authentication → Emails → SMTP Settings (the form is prefilled, just add the key):
- Sender email `noreply@ayoquotethat.com`, sender name `Peekaboo`
- Host `smtp.resend.com`, port `465`, username `resend`, password = the key
- Save.

## 3. Reset-password template (only editable after step 2)
Dashboard → Authentication → Emails → Templates → Reset password
- Subject: `Your Peekaboo reset code`
- Body (Source):
```html
<h2>Reset your Peekaboo password</h2>
<p>Enter this code in the app:</p>
<p style="font-size:28px;font-weight:800;letter-spacing:4px">{{ .Token }}</p>
<p>It expires in an hour. If you did not ask for this, ignore it.</p>
```
The app calls `verifyOtp({ type: 'recovery' })` with that code.

## 4. Legal pages live
Create a public GitHub repo `nshaeffer05/peekaboo`, push, enable Pages from `main` with `/docs` as the folder
(or serve the `docs` folder). The app links to `https://nshaeffer05.github.io/peekaboo/`.
`add.html` there is what a friend's QR code opens.

## 5. Build
```bash
cd ~/Desktop/peekaboo
npx eas-cli build --platform ios --profile production
```
Interactive (Apple sign-in). First build creates the App Store Connect record. See `docs/app-review.md` for the listing answers.
