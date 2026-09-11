import { NextResponse } from "next/server";
import { z } from "zod";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  appPassword,
  constantTimeEqual,
  createSessionToken,
} from "@/lib/auth";

const loginSchema = z.object({ password: z.string().max(500) });

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Logs in: `{ password }` → a session cookie. */
export async function POST(request: Request) {
  const password = appPassword();
  if (!password) {
    return NextResponse.json({ error: "The password lock is off on this server." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !constantTimeEqual(parsed.data.password, password)) {
    // A short pause makes guessing the password one attempt at a time slow.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "That password is not right." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(password), {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE_S,
  });
  return response;
}

/** Logs out. */
export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
