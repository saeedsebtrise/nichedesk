/**
 * The optional password lock for a deployed NicheDesk.
 *
 * With APP_PASSWORD set, the tool and its editing APIs need either a session
 * cookie (after logging in on /login) or `Authorization: Bearer <password>`
 * (how the extension's "Send to NicheDesk" gets in). Without it — the normal
 * local setup — nothing is locked.
 *
 * Sessions are stateless: the cookie is an expiry time signed with HMAC,
 * keyed by the password, so changing the password logs every session out.
 * Web Crypto only, so this runs anywhere the proxy does.
 */

export const SESSION_COOKIE = "nd_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

export function appPassword(): string | null {
  const password = process.env.APP_PASSWORD ?? "";
  return password.length > 0 ? password : null;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`nichedesk-session:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** Compares without an early exit, so timing does not reveal how much matched. */
export function constantTimeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let difference = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return difference === 0;
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const payload = `v1.${now + SESSION_MAX_AGE_S * 1000}`;
  return `${payload}.${await sign(secret, payload)}`;
}

export async function verifySessionToken(token: string, secret: string, now = Date.now()): Promise<boolean> {
  const [version, expires, signature] = token.split(".");
  if (version !== "v1" || !expires || !signature) return false;
  if (!(Number(expires) > now)) return false;
  return constantTimeEqual(signature, await sign(secret, `${version}.${expires}`));
}

/** Where to send someone after login — only ever a path on this site. */
export function safeNextPath(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/app";
}
