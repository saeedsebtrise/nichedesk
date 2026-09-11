/**
 * License checks against the NicheDesk server (POST /api/licenses/verify).
 *
 * The only things sent are the key and a random device id generated on first
 * run — never keywords, settings or anything about the user's accounts.
 */

const HOUR_MS = 60 * 60 * 1000;

export async function getDeviceId(storage = chrome.storage.local) {
  const { deviceId } = await storage.get("deviceId");
  if (deviceId) return deviceId;
  const fresh = crypto.randomUUID();
  await storage.set({ deviceId: fresh });
  return fresh;
}

/** Asks the server about `key`; network failures come back as `{ offline: true }`, not throws. */
export async function checkLicense({ key, serverUrl, deviceId, fetchImpl = (...a) => fetch(...a) }) {
  const checkedAt = new Date().toISOString();
  if (!key) return { valid: false, reason: "missing", key, checkedAt };

  try {
    const response = await fetchImpl(`${serverUrl.replace(/\/$/, "")}/api/licenses/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, deviceId }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { valid: false, reason: "error", error: body.error ?? `HTTP ${response.status}`, key, checkedAt };
    }
    return { ...body, key, checkedAt };
  } catch {
    return { valid: false, reason: "offline", offline: true, key, checkedAt };
  }
}

const day = (iso) => (iso ? String(iso).slice(0, 10) : "?");

/** One line for the popup: "Valid · expires 2026-10-11 · device 1/3". */
export function describeLicense(result) {
  if (!result) return "Not checked yet";
  if (result.valid) {
    return `Valid · expires ${day(result.expiresAt)} · device ${result.devicesUsed}/${result.maxDevices}`;
  }
  switch (result.reason) {
    case "missing":
      return "Enter your license key";
    case "unknown":
      return "That key is not recognised — check it for typos";
    case "expired":
      return `Expired on ${day(result.expiresAt)}`;
    case "revoked":
      return "This key has been revoked";
    case "device-limit":
      return `Device limit reached (${result.devicesUsed}/${result.maxDevices}) — ask for a seat reset`;
    case "offline":
      return "Could not reach the license server";
    default:
      return result.error ? `License check failed: ${result.error}` : "License check failed";
  }
}

/**
 * Whether a run may start on the cached check `cache` for `key`.
 *
 * A fresh valid result is used as-is; a stale one needs re-checking. If that
 * re-check cannot reach the server, a key that was valid within the grace
 * window keeps working, so a flaky connection does not stop a paying user.
 */
export function licenseGate(cache, key, now, { recheckHours, graceDays }) {
  if (!key) return { ok: false, mustCheck: false };
  if (!cache || cache.key !== key || !cache.valid) return { ok: false, mustCheck: true };

  const expired = new Date(cache.expiresAt).getTime() <= now.getTime();
  if (expired) return { ok: false, mustCheck: true };

  const age = now.getTime() - new Date(cache.checkedAt).getTime();
  return { ok: age < recheckHours * HOUR_MS, mustCheck: age >= recheckHours * HOUR_MS, withinGrace: age < graceDays * 24 * HOUR_MS };
}
