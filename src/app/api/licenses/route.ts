import { requireAdmin } from "@/lib/admin";
import { handle, parseBody } from "@/lib/api";
import { licenseCreateSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

/** Every license, newest first. Admin only. */
export async function GET(request: Request) {
  return handle(async () => {
    requireAdmin(request);
    return getStore().listLicenses();
  });
}

/** Issues a new key: `{ days, note?, maxDevices? }`. Admin only. */
export async function POST(request: Request) {
  return handle(async () => {
    requireAdmin(request);
    const input = await parseBody(request, licenseCreateSchema);
    return getStore().createLicense(input);
  });
}
