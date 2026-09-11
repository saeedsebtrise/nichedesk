import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { appPassword } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Keyword desk",
  description: "Import eRank keywords, sort them into niches and work through them.",
  // The workspace is private working data, not a page for search results.
  robots: { index: false, follow: false },
};

// Read per request so a reload always shows what is on disk.
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const data = await getStore().read();

  return <AppShell initialData={data} locked={appPassword() !== null} />;
}
