import { handle, parseBody } from "@/lib/api";
import { keywordPatchSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  return handle(async () => {
    const { id } = await params;
    const patch = await parseBody(request, keywordPatchSchema);
    return getStore().updateKeyword(id, patch);
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  return handle(async () => {
    const { id } = await params;
    const removed = await getStore().bulkKeywords([id], { action: "delete" });
    return { removed };
  });
}
