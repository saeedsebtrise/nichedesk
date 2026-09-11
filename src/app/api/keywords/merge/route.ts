import { handle, parseBody } from "@/lib/api";
import { mergeSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

/** Folds duplicate keywords into one kept copy per group (the duplicate finder). */
export async function POST(request: Request) {
  return handle(async () => {
    const { groups } = await parseBody(request, mergeSchema);
    return getStore().mergeKeywords(groups);
  });
}
