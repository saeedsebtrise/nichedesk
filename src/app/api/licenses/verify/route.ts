import { handle, parseBody } from "@/lib/api";
import { licenseCheckSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

/**
 * The one public license route: the extension posts its key and device id and
 * learns whether it may run. CORS is open because the caller is a browser
 * extension on the customer's machine, and a leaked response reveals nothing
 * beyond what the key holder already has — keys carry 60 random bits, so this
 * endpoint cannot be used to find valid ones.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  return handle(async () => {
    const { key, deviceId } = await parseBody(request, licenseCheckSchema);
    return getStore().checkLicense(key, deviceId);
  }, CORS);
}
