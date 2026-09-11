import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

/** Clears an extension batch from the inbox once it has been opened or dismissed. */
export async function DELETE(_request: Request, { params }: Context) {
  return handle(async () => {
    const { id } = await params;
    await getStore().removeInboxBatch(id);
    return { removed: true };
  });
}
