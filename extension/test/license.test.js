import { describe, expect, it, vi } from "vitest";

import { checkLicense, describeLicense, licenseGate } from "../src/lib/license.js";

const now = new Date("2026-09-11T12:00:00.000Z");
const hoursAgo = (h) => new Date(now.getTime() - h * 3_600_000).toISOString();
const options = { recheckHours: 12, graceDays: 3 };

const cache = (overrides = {}) => ({
  key: "NDSK-AAAA-BBBB-CCCC",
  valid: true,
  expiresAt: "2026-10-11T00:00:00.000Z",
  checkedAt: hoursAgo(1),
  devicesUsed: 1,
  maxDevices: 3,
  ...overrides,
});

describe("describeLicense", () => {
  it("summarises a valid key like the settings screen shows it", () => {
    expect(describeLicense(cache())).toBe("Valid · expires 2026-10-11 · device 1/3");
  });

  it("explains each failure", () => {
    expect(describeLicense({ valid: false, reason: "unknown" })).toMatch(/not recognised/);
    expect(describeLicense({ valid: false, reason: "expired", expiresAt: "2026-09-01T00:00:00Z" })).toBe("Expired on 2026-09-01");
    expect(describeLicense({ valid: false, reason: "device-limit", devicesUsed: 3, maxDevices: 3 })).toMatch(/3\/3/);
    expect(describeLicense({ valid: false, reason: "offline" })).toMatch(/license server/);
  });
});

describe("licenseGate", () => {
  it("needs a key", () => {
    expect(licenseGate(cache(), "", now, options)).toEqual({ ok: false, mustCheck: false });
  });

  it("trusts a recent valid check", () => {
    expect(licenseGate(cache(), "NDSK-AAAA-BBBB-CCCC", now, options)).toMatchObject({ ok: true, mustCheck: false });
  });

  it("re-checks a stale result but allows it offline within the grace window", () => {
    expect(licenseGate(cache({ checkedAt: hoursAgo(30) }), "NDSK-AAAA-BBBB-CCCC", now, options)).toMatchObject({
      ok: false,
      mustCheck: true,
      withinGrace: true,
    });
    expect(licenseGate(cache({ checkedAt: hoursAgo(24 * 5) }), "NDSK-AAAA-BBBB-CCCC", now, options)).toMatchObject({
      withinGrace: false,
    });
  });

  it("re-checks when the key changed, and never graces an expired key", () => {
    expect(licenseGate(cache(), "NDSK-ZZZZ-ZZZZ-ZZZZ", now, options)).toEqual({ ok: false, mustCheck: true });
    expect(licenseGate(cache({ expiresAt: "2026-09-01T00:00:00Z" }), "NDSK-AAAA-BBBB-CCCC", now, options)).toEqual({
      ok: false,
      mustCheck: true,
    });
  });
});

describe("checkLicense", () => {
  it("posts the key and device id to the verify endpoint", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ valid: true, expiresAt: "x", devicesUsed: 1, maxDevices: 3 }) }));

    const result = await checkLicense({ key: "NDSK-AAAA-BBBB-CCCC", serverUrl: "http://localhost:3000/", deviceId: "device-1", fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith("http://localhost:3000/api/licenses/verify", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ key: "NDSK-AAAA-BBBB-CCCC", deviceId: "device-1" });
    expect(result).toMatchObject({ valid: true, key: "NDSK-AAAA-BBBB-CCCC" });
  });

  it("reports an unreachable server as offline instead of throwing", async () => {
    const result = await checkLicense({
      key: "k",
      serverUrl: "http://x",
      deviceId: "d",
      fetchImpl: vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    });

    expect(result).toMatchObject({ valid: false, offline: true, reason: "offline" });
  });

  it("does not call out without a key", async () => {
    const fetchImpl = vi.fn();

    expect(await checkLicense({ key: "", serverUrl: "http://x", deviceId: "d", fetchImpl })).toMatchObject({ reason: "missing" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
