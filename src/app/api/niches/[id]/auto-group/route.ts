import { handle, parseBody } from "@/lib/api";
import { autoGroupSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

/** Sorts the niche's own keywords into auto-created subniches: `{ minGroupSize? }`. */
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    const { id } = await params;
    const options = await parseBody(request, autoGroupSchema);
    return getStore().autoGroupNiche(id, options);
  });
}
