import { timingSafeEqual } from "node:crypto";

/** A request to an admin route that is not allowed through; carries its HTTP status. */
export class AdminAuthError extends Error {
  constructor(
    readonly status: 401 | 503,
    message: string,
  ) {
    super(message);
  }
}

const MIN_TOKEN_LENGTH = 16;

/**
 * Guards the license-management routes.
 *
 * The app has no user accounts, so admin access is a single shared secret in
 * NICHEDESK_ADMIN_TOKEN. With no token configured the routes stay closed
 * rather than open, and the comparison is constant-time so response timing
 * cannot be used to guess the token a character at a time.
 */
export function requireAdmin(request: Request): void {
  const token = process.env.NICHEDESK_ADMIN_TOKEN ?? "";
  if (token.length < MIN_TOKEN_LENGTH) {
    throw new AdminAuthError(
      503,
      `License management is off. Set NICHEDESK_ADMIN_TOKEN (${MIN_TOKEN_LENGTH}+ characters) on the server.`,
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.startsWith("Bearer ") ? header.slice(7) : "");
  const expected = Buffer.from(token);

  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw new AdminAuthError(401, "Admin token missing or wrong.");
  }
}
