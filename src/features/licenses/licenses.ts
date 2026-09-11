import { randomBytes } from "node:crypto";

/**
 * License keys for the NicheDesk Research extension.
 *
 * Keys look like `NDSK-7KQ2-M9XD-4HPA`: short enough to paste from a WhatsApp
 * message, with 60 random bits behind them. The alphabet leaves out 0/O and
 * 1/I so a key retyped by hand cannot be misread.
 */

export type LicenseDevice = {
  id: string;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type License = {
  key: string;
  note: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  /** How many browsers may use this key at once. */
  maxDevices: number;
  devices: LicenseDevice[];
};

export type LicenseCheck =
  | {
      valid: true;
      expiresAt: string;
      devicesUsed: number;
      maxDevices: number;
    }
  | {
      valid: false;
      reason: "unknown" | "expired" | "revoked" | "device-limit";
      expiresAt?: string;
      devicesUsed?: number;
      maxDevices?: number;
    };

export const LICENSE_PREFIX = "NDSK";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BODY_LENGTH = 12;

const format = (body: string) =>
  `${LICENSE_PREFIX}-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;

export function generateLicenseKey(bytes: (size: number) => Uint8Array = randomBytes): string {
  let body = "";
  // 256 is a multiple of 32, so taking each byte modulo the alphabet is unbiased.
  for (const byte of bytes(BODY_LENGTH)) body += ALPHABET[byte % ALPHABET.length];
  return format(body);
}

/**
 * Canonical form of whatever the customer pasted — any case, with or without
 * dashes or stray spaces — or `null` when it cannot be a NicheDesk key.
 */
export function normalizeLicenseKey(input: string): string | null {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!compact.startsWith(LICENSE_PREFIX)) return null;

  const body = compact.slice(LICENSE_PREFIX.length);
  if (body.length !== BODY_LENGTH) return null;
  if ([...body].some((char) => !ALPHABET.includes(char))) return null;

  return format(body);
}

/**
 * Decides whether `deviceId` may use `license` right now.
 *
 * A device already on the license always passes (while the key is live), so a
 * customer is never locked out of their own browser; a new device passes only
 * while there is a free seat. Registering the seat is the caller's job.
 */
export function evaluateLicense(
  license: License | undefined,
  deviceId: string,
  now: Date,
): LicenseCheck {
  if (!license) return { valid: false, reason: "unknown" };

  const seats = { expiresAt: license.expiresAt, maxDevices: license.maxDevices };

  if (license.revokedAt) {
    return { valid: false, reason: "revoked", ...seats, devicesUsed: license.devices.length };
  }
  if (new Date(license.expiresAt).getTime() <= now.getTime()) {
    return { valid: false, reason: "expired", ...seats, devicesUsed: license.devices.length };
  }

  const known = license.devices.some((device) => device.id === deviceId);
  if (known) return { valid: true, ...seats, devicesUsed: license.devices.length };

  if (license.devices.length < license.maxDevices) {
    return { valid: true, ...seats, devicesUsed: license.devices.length + 1 };
  }

  return {
    valid: false,
    reason: "device-limit",
    ...seats,
    devicesUsed: license.devices.length,
  };
}

/** Records that `deviceId` checked in, adding it as a seat the first time. */
export function touchDevice(license: License, deviceId: string, now: Date): void {
  const stamp = now.toISOString();
  const device = license.devices.find((candidate) => candidate.id === deviceId);

  if (device) device.lastSeenAt = stamp;
  else license.devices.push({ id: deviceId, firstSeenAt: stamp, lastSeenAt: stamp });
}
