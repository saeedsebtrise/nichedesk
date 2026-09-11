import { handle, parseBody } from "@/lib/api";
import { bulkSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  return handle(async () => {
    const { ids, action } = await parseBody(request, bulkSchema);
    const changed = await getStore().bulkKeywords(ids, action);
    return { changed };
  });
}
