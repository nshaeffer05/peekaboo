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

## 6. Local builds (Xcode)
System Ruby cannot build CocoaPods against the Xcode 27 SDK, so install Homebrew first (asks for your password), then:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install cocoapods
cd ~/Desktop/peekaboo && npx expo run:ios        # builds, installs on the simulator, starts Metro
open ios/Peekaboo.xcworkspace                    # to work in Xcode itself (after the first pod install)
```
`ios/` is generated and gitignored; never edit it by hand, change `app.json` and re-run prebuild.

## 7. TestFlight for friends and family
Group "Friends and family" exists with build 6 in it. Finish the Test Information sheet (phone number, review-account password), press Next, then Submit for Beta App Review. After approval, open the group → Testers → enable Public Link and send that link to people. The Account Holder must also accept the updated Developer Program License Agreement (banner on the Apps page) or the submission is refused.

## 8. Local release builds (preferred from 2026-10-31)

EAS cloud builds are limited on the free plan; build on the Mac instead.

```bash
cd ~/Desktop/peekaboo && source .env.local
npx eas-cli build --platform ios --profile production --local --output build/peekaboo.ipa
npx eas-cli submit --platform ios --profile production --path build/peekaboo.ipa
```

The first command uses the signing credentials EAS already holds, needs Homebrew CocoaPods and fastlane on PATH, and bumps `ios.buildNumber` in app.json (commit it). The second uploads to App Store Connect; processing takes 5-10 minutes, then add the build to the TestFlight group. JS-only changes can instead ship instantly with `npx eas-cli update --channel production --environment production --message "..."`.
