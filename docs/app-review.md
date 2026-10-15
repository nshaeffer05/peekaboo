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

**Demo account.** Create two accounts and friend them so the reviewer can send a photo to themselves on a second device, or note that they can test with a single device by sending to a friend account and signing in as that account.

**Screenshots blocked.** expo-screen-capture prevents screenshots and recordings while a photo is on screen (iOS 13+).
