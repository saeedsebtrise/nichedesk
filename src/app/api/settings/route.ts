import { handle, parseBody } from "@/lib/api";
import { settingsPatchSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

export async function PATCH(request: Request) {
  return handle(async () => {
    const patch = await parseBody(request, settingsPatchSchema);
    return getStore().updateSettings(patch);
  });
}
