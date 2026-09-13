import { handle, parseBody } from "@/lib/api";
import { trademarkLookupSchema } from "@/lib/schemas";
import { lookupTrademarks } from "@/lib/uspto";

/** Up to three USPTO searches run per request. */
export const maxDuration = 45;

export async function POST(request: Request) {
  return handle(async () => {
    const { terms } = await parseBody(request, trademarkLookupSchema);
    return lookupTrademarks(terms);
  });
}
