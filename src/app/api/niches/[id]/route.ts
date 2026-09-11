import { handle, parseBody } from "@/lib/api";
import { nicheDeleteModeSchema, nichePatchSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  return handle(async () => {
    const { id } = await params;
    const patch = await parseBody(request, nichePatchSchema);
    return getStore().updateNiche(id, patch);
  });
}

export async function DELETE(request: Request, { params }: Context) {
  return handle(async () => {
    const { id } = await params;
    const mode = nicheDeleteModeSchema.parse(
      new URL(request.url).searchParams.get("mode") ?? undefined,
    );
    await getStore().deleteNiche(id, mode);
    return { ok: true };
  });
}
