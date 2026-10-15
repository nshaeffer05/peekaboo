// Legal pages are served from GitHub Pages, like Doodleoff's.
export const SITE_URL = 'https://nshaeffer05.github.io/peekaboo';
export const TERMS_URL = `${SITE_URL}/terms.html`;
export const PRIVACY_URL = `${SITE_URL}/privacy.html`;
export const SUPPORT_URL = `${SITE_URL}/support.html`;
export const SUPPORT_EMAIL = 'support@ayoquotethat.com';

/** What a friend's QR code holds. Opens the add page on the web, and the scanner reads it directly. */
export const addLink = (username: string) => `${SITE_URL}/add?u=${encodeURIComponent(username)}`;

/** Pulls a username out of a scanned code or pasted link. Accepts the web link, the app scheme, or a bare @name. */
export const parseAddLink = (text: string): string | null => {
  const t = text.trim();
  const m =
    t.match(/[?&]u=([a-z0-9_]{3,20})/i) ??
    t.match(/^peekaboo:\/\/add\/([a-z0-9_]{3,20})$/i) ??
    t.match(/^@?([a-z0-9_]{3,20})$/i);
  return m ? m[1].toLowerCase() : null;
};
