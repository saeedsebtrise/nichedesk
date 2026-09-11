/**
 * Manage NicheDesk Research license keys from the command line.
 *
 *   node scripts/license.mjs create --days 30 [--devices 3] [--note "Ali Khan"]
 *   node scripts/license.mjs list
 *   node scripts/license.mjs revoke NDSK-XXXX-XXXX-XXXX
 *   node scripts/license.mjs reset  NDSK-XXXX-XXXX-XXXX     # frees every device seat
 *
 * Talks to a running NicheDesk server. Set NICHEDESK_URL (default
 * http://localhost:3000) and NICHEDESK_ADMIN_TOKEN — the same token the
 * server was started with.
 */
const base = (process.env.NICHEDESK_URL ?? "http://localhost:3000").replace(/\/$/, "");
const token = process.env.NICHEDESK_ADMIN_TOKEN;

const [command, ...rest] = process.argv.slice(2);

function flag(name, fallback) {
  const index = rest.indexOf(`--${name}`);
  return index === -1 ? fallback : rest[index + 1];
}

async function call(method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
  return payload;
}

const day = (iso) => iso.slice(0, 10);

function describe(license) {
  const state = license.revokedAt
    ? "revoked"
    : new Date(license.expiresAt) <= new Date()
      ? "expired"
      : "active";
  return [
    license.key,
    state.padEnd(7),
    `expires ${day(license.expiresAt)}`,
    `devices ${license.devices.length}/${license.maxDevices}`,
    license.note ? `— ${license.note}` : "",
  ].join("  ");
}

async function main() {
  if (!token) throw new Error("Set NICHEDESK_ADMIN_TOKEN to the server's admin token.");

  if (command === "create") {
    const days = Number(flag("days", "30"));
    const maxDevices = Number(flag("devices", "3"));
    const note = flag("note", "");
    const license = await call("POST", "/api/licenses", { days, maxDevices, note });
    console.log(`\n  ${license.key}\n`);
    console.log(`  Valid until ${day(license.expiresAt)} on up to ${license.maxDevices} device(s).`);
    return;
  }

  if (command === "list") {
    const licenses = await call("GET", "/api/licenses");
    if (licenses.length === 0) console.log("No licenses yet.");
    for (const license of licenses) console.log(describe(license));
    return;
  }

  if (command === "revoke" || command === "reset") {
    const key = rest[0];
    if (!key) throw new Error(`Usage: node scripts/license.mjs ${command} NDSK-XXXX-XXXX-XXXX`);
    const action = command === "revoke" ? "revoke" : "reset-devices";
    const license = await call("PATCH", `/api/licenses/${encodeURIComponent(key)}`, { action });
    console.log(describe(license));
    return;
  }

  console.log("Commands: create --days N [--devices N] [--note TEXT] | list | revoke KEY | reset KEY");
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
