import { handle, parseBody } from "@/lib/api";
import { inboxSendSchema } from "@/lib/schemas";
import { StoreValidationError, getStore } from "@/lib/store";

/**
 * Where the browser extension drops keywords read off an eRank page. The batch
 * waits in the workspace inbox until someone opens it in Sort Keyword; nothing
 * lands in a niche from here.
 *
 * The caller is an extension on the customer's machine, so CORS is open (as
 * for /api/licenses/verify) and the gate is a valid license key for that
 * device rather than the workspace session.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

const REFUSED: Record<string, string> = {
  unknown: "That license key is not recognised.",
  expired: "This license has expired.",
  revoked: "This license has been revoked.",
  "device-limit": "This license is already in use on its maximum number of devices.",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  return handle(async () => {
    const { key, deviceId, label, source, rows } = await parseBody(request, inboxSendSchema);
    const store = getStore();

    const license = await store.checkLicense(key, deviceId);
    if (!license.valid) throw new StoreValidationError(REFUSED[license.reason] ?? "The license check failed.");

    const batch = await store.addInboxBatch({ source, label, rows });
    return { id: batch.id, label: batch.label, count: batch.rows.length };
  }, CORS);
}
