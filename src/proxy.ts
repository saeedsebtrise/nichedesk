import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, appPassword, constantTimeEqual, verifySessionToken } from "@/lib/auth";

/**
 * Password lock for a deployed NicheDesk (see src/lib/auth.ts). Only the paths
 * in `config.matcher` pass through here: the landing page, /login, the session
 * API and the license routes (which carry their own auth) stay public.
 */
export async function proxy(request: NextRequest) {
  const password = appPassword();
  if (!password) return NextResponse.next();

  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (bearer && constantTimeEqual(bearer, password)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && (await verifySessionToken(token, password))) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Log in to NicheDesk first." }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  // /api/extension/* is deliberately absent: the extension proves itself with a license key.
  matcher: ["/app/:path*", "/api/data", "/api/niches/:path*", "/api/keywords/:path*", "/api/settings", "/api/inbox/:path*"],
};
