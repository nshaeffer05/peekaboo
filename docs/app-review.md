# App Store Connect answers for Peekaboo

**What it is.** Disappearing photos between friends. Take a photo, pick friends or a group, send. Each recipient sees it once for eleven seconds. Then it is deleted. No chat, no gallery, no saving.

**Age rating.** 13+. Sign-up has a 13-or-older checkbox and links to Terms and Privacy.

**User-generated content (Guideline 1.2).**
- Only accepted friends can send to each other. Strangers cannot message anyone.
- Every photo has a Report flag on screen. Reported photos are held for review instead of deleted.
- Any user can block another (Friends → tap the person → Block). Blocking removes the friendship and anything unopened from that person.
- Reports are reviewed within 24 hours (reports table in Supabase).
- Terms of Use include a zero-tolerance clause for objectionable content.

**Account deletion (5.1.1 v).** Settings → Delete account. Immediate; removes profile, friendships, groups, unopened photos, push token.

**Privacy nutrition labels.** Email (account), username (user content), photos (user content, not linked beyond delivery, deleted after viewing), push token (identifiers). No tracking.

**Camera usage string.** "Peekaboo uses the camera to take the photo you are about to send."

**Demo account.** Review sign-in is `applereview@ayoquotethat.com` (create it in the app or in Supabase Auth → Users with auto-confirm; password known only to Nick). Friend it with a second account so the reviewer can send a photo and open one.

**Screenshots blocked.** expo-screen-capture prevents screenshots and recordings while a photo is on screen (iOS 13+).

## Accounts (created 2026-10-29)

- Review account `applereview@ayoquotethat.com`, username `applereview`. Its password is the one entered under TestFlight > Test Information > Sign-In Information.
- Helper friend `reviewbuddy@ayoquotethat.com`, username `peekaboobear`; password is noted in the local `.env.local`. Already accepted as a friend of the review account so reviewers have someone to send to.
