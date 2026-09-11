import { handle, parseBody } from "@/lib/api";
import { importSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  return handle(async () => {
    const { rows, nicheId } = await parseBody(request, importSchema);
    return getStore().importKeywords(rows, nicheId);
  });
}
