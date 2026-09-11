import { describe, expect, it } from "vitest";

import {
  evaluateLicense,
  generateLicenseKey,
  normalizeLicenseKey,
  touchDevice,
  type License,
} from "./licenses";

const now = new Date("2026-09-11T12:00:00.000Z");

const license = (overrides: Partial<License> = {}): License => ({
  key: "NDSK-ABCD-EFGH-JKLM",
  note: "",
  createdAt: "2026-09-01T00:00:00.000Z",
  expiresAt: "2026-10-01T00:00:00.000Z",
  revokedAt: null,
  maxDevices: 2,
  devices: [],
  ...overrides,
});

describe("generateLicenseKey", () => {
  it("produces the NDSK-XXXX-XXXX-XXXX shape", () => {
    expect(generateLicenseKey()).toMatch(/^NDSK-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("never uses the ambiguous characters 0, O, 1 or I", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generateLicenseKey().slice(5)).not.toMatch(/[01OI]/);
    }
  });

  it("maps every byte value onto the alphabet", () => {
    const key = generateLicenseKey((size) => new Uint8Array(size).fill(255));

    expect(normalizeLicenseKey(key)).toBe(key);
  });
});

describe("normalizeLicenseKey", () => {
  it("accepts any case, spacing and dash placement", () => {
    expect(normalizeLicenseKey("  ndsk abcd-efgh jklm ")).toBe("NDSK-ABCD-EFGH-JKLM");
    expect(normalizeLicenseKey("NDSKABCDEFGHJKLM")).toBe("NDSK-ABCD-EFGH-JKLM");
  });

  it("rejects the wrong prefix, length or characters", () => {
    expect(normalizeLicenseKey("NICH-ABCD-EFGH-JKLM")).toBeNull();
    expect(normalizeLicenseKey("NDSK-ABCD-EFGH")).toBeNull();
    expect(normalizeLicenseKey("NDSK-ABCD-EFGH-JKL0")).toBeNull();
  });
});

describe("evaluateLicense", () => {
  it("rejects a key that does not exist", () => {
    expect(evaluateLicense(undefined, "device-a", now)).toEqual({ valid: false, reason: "unknown" });
  });

  it("rejects a revoked key even before it expires", () => {
    const result = evaluateLicense(license({ revokedAt: "2026-09-05T00:00:00.000Z" }), "device-a", now);

    expect(result).toMatchObject({ valid: false, reason: "revoked" });
  });

  it("rejects an expired key", () => {
    const result = evaluateLicense(license({ expiresAt: "2026-09-10T00:00:00.000Z" }), "device-a", now);

    expect(result).toMatchObject({ valid: false, reason: "expired" });
  });

  it("admits a new device while seats are free and counts it", () => {
    expect(evaluateLicense(license(), "device-a", now)).toEqual({
      valid: true,
      expiresAt: "2026-10-01T00:00:00.000Z",
      devicesUsed: 1,
      maxDevices: 2,
    });
  });

  it("always admits a device that already holds a seat", () => {
    const full = license({
      devices: [
        { id: "device-a", firstSeenAt: "", lastSeenAt: "" },
        { id: "device-b", firstSeenAt: "", lastSeenAt: "" },
      ],
    });

    expect(evaluateLicense(full, "device-b", now)).toMatchObject({ valid: true, devicesUsed: 2 });
  });

  it("turns away a new device once every seat is taken", () => {
    const full = license({
      devices: [
        { id: "device-a", firstSeenAt: "", lastSeenAt: "" },
        { id: "device-b", firstSeenAt: "", lastSeenAt: "" },
      ],
    });

    expect(evaluateLicense(full, "device-c", now)).toMatchObject({
      valid: false,
      reason: "device-limit",
      devicesUsed: 2,
      maxDevices: 2,
    });
  });
});

describe("touchDevice", () => {
  it("adds a device the first time and only updates it afterwards", () => {
    const target = license();

    touchDevice(target, "device-a", now);
    touchDevice(target, "device-a", new Date("2026-09-12T00:00:00.000Z"));

    expect(target.devices).toEqual([
      {
        id: "device-a",
        firstSeenAt: "2026-09-11T12:00:00.000Z",
        lastSeenAt: "2026-09-12T00:00:00.000Z",
      },
    ]);
  });
});
