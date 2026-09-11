import { handle } from "@/lib/api";
import { getStore } from "@/lib/store";

/** One round trip for the whole workspace: niches, keywords and settings. */
export async function GET() {
  return handle(() => getStore().read());
}
