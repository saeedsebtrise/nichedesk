import { handle, parseBody } from "@/lib/api";
import { newNicheSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  return handle(async () => {
    const input = await parseBody(request, newNicheSchema);
    return getStore().createNiche(input);
  });
}
