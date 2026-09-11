import { describe, expect, it } from "vitest";

import { SESSION_MAX_AGE_S, constantTimeEqual, createSessionToken, safeNextPath, verifySessionToken } from "./auth";

const now = Date.parse("2026-09-11T12:00:00.000Z");

describe("session tokens", () => {
  it("verifies a token signed with the same password", async () => {
    const token = await createSessionToken("hunter2-long-password", now);

    await expect(verifySessionToken(token, "hunter2-long-password", now)).resolves.toBe(true);
  });

  it("stops working once the password changes", async () => {
    const token = await createSessionToken("old-password", now);

    await expect(verifySessionToken(token, "new-password", now)).resolves.toBe(false);
  });

  it("expires", async () => {
    const token = await createSessionToken("pw", now);

    await expect(verifySessionToken(token, "pw", now + (SESSION_MAX_AGE_S + 1) * 1000)).resolves.toBe(false);
  });

  it("rejects a token whose expiry was edited", async () => {
    const [version, expires, signature] = (await createSessionToken("pw", now)).split(".");
    const forged = `${version}.${Number(expires) + 86_400_000}.${signature}`;

    await expect(verifySessionToken(forged, "pw", now)).resolves.toBe(false);
  });

  it("rejects malformed tokens", async () => {
    for (const token of ["", "v1", "v1.123", "v2.9999999999999.abc", "garbage"]) {
      await expect(verifySessionToken(token, "pw", now)).resolves.toBe(false);
    }
  });
});

describe("constantTimeEqual", () => {
  it("compares whole strings of any length", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
    expect(constantTimeEqual("", "")).toBe(true);
  });
});

describe("safeNextPath", () => {
  it("keeps paths on this site and nothing else", () => {
    expect(safeNextPath("/app?tab=work")).toBe("/app?tab=work");
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("/\\evil.example")).toBe("/app");
    expect(safeNextPath("https://evil.example")).toBe("/app");
    expect(safeNextPath(undefined)).toBe("/app");
  });
});
