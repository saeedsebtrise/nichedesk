import { handle, parseBody } from "@/lib/api";
import { trademarkLookupSchema } from "@/lib/schemas";
import { lookupWikipedia } from "@/lib/wikipedia";

/** Several Wikipedia queries can run per request. */
export const maxDuration = 45;

export async function POST(request: Request) {
  return handle(async () => {
    const { terms } = await parseBody(request, trademarkLookupSchema);
    return lookupWikipedia(terms);
  });
}
