import { requireAdmin } from "@/lib/admin";
import { handle, parseBody } from "@/lib/api";
import { licenseActionSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

type Context = { params: Promise<{ key: string }> };

/** `{ action: "revoke" | "reset-devices" }` on one key. Admin only. */
export async function PATCH(request: Request, { params }: Context) {
  return handle(async () => {
    requireAdmin(request);
    const { key } = await params;
    const { action } = await parseBody(request, licenseActionSchema);
    return getStore().updateLicense(decodeURIComponent(key), action);
  });
}
