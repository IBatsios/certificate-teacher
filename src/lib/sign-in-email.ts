/**
 * The magic-link email, as content only. Both transports render this, so a
 * developer reading their mail in Mailpit sees what a student receives (D67).
 *
 * The copy matters beyond politeness. A message that is one link and almost
 * no words reads as phishing to a spam filter, and the first one this app
 * sent from a new domain went to the junk folder. It also has to make sense
 * to a reader with no technical experience, who did not necessarily expect it.
 */

/** How long a sign-in link stays valid. Also the providers' `maxAge`. */
export const SIGN_IN_LINK_MAX_AGE_SECONDS = 24 * 60 * 60;

const EXPIRY_HOURS = SIGN_IN_LINK_MAX_AGE_SECONDS / 60 / 60;

// Wrapped at render time rather than written pre-broken, because the host is
// interpolated and a long one would push a hardcoded first line over the edge.
const TEXT_WIDTH = 72;

export type SignInEmail = Readonly<{
  subject: string;
  text: string;
  html: string;
}>;

export function signInEmail(
  params: Readonly<{ url: string; host: string }>,
): SignInEmail {
  const { url, host } = params;
  return {
    subject: `Your sign-in link for ${host}`,
    text: plainText(url, host),
    html: htmlBody(url, host),
  };
}

function plainText(url: string, host: string): string {
  const paragraphs = [
    `You asked to sign in to ${host}, the course that teaches how certificates and HTTPS work. Open this link and you are signed in. There is no password to remember.`,
    `The link works once and stops working after ${EXPIRY_HOURS} hours. If it has expired, go back to ${host} and ask for a new one.`,
    `If you did not ask to sign in, you can ignore this email. Nothing has changed on your account, and nobody can get in without opening the link above.`,
  ].map((paragraph) => wrap(paragraph, TEXT_WIDTH));

  // The link is one unbreakable token on its own line: a wrapped URL is a
  // dead URL, and the browser tests read it straight out of this part.
  const [opening, ...rest] = paragraphs;
  return [opening, url, ...rest].join("\n\n");
}

function wrap(paragraph: string, width: number): string {
  const lines: Array<string> = [];
  let line = "";
  for (const word of paragraph.split(" ")) {
    if (line === "") {
      line = word;
    } else if (`${line} ${word}`.length <= width) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== "") {
    lines.push(line);
  }
  return lines.join("\n");
}

function htmlBody(url: string, host: string): string {
  const safeUrl = escapeHtml(url);
  const safeHost = escapeHtml(host);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5f5f4;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1c1917;line-height:1.6">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:8px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600">Sign in to ${safeHost}</h1>
      <p style="margin:0 0 16px">
        You asked to sign in to ${safeHost}, the course that teaches how
        certificates and HTTPS work. Open the link below and you are signed in.
        There is no password to remember.
      </p>
      <p style="margin:0 0 24px">
        <a href="${safeUrl}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Sign me in</a>
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#57534e">
        If the button does not work, copy this address into your browser:<br />
        <span style="word-break:break-all">${safeUrl}</span>
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#57534e">
        The link works once and stops working after ${EXPIRY_HOURS} hours. If it
        has expired, go back to ${safeHost} and ask for a new one.
      </p>
      <p style="margin:0;font-size:14px;color:#57534e">
        If you did not ask to sign in, you can ignore this email. Nothing has
        changed on your account, and nobody can get in without opening the link
        above.
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
