import type { Viewport } from "next";

import { MotionProvider } from "@/components/marketing/motion";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";

export const viewport: Viewport = {
  themeColor: "#0c0806",
};

/**
 * Chrome for the public pages only. The tool at /app brings its own header, so
 * the marketing nav lives in this route group rather than the root layout.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      {/* `mk` switches on the dark, screen-scaled marketing theme (globals.css). */}
      <div className="mk flex min-h-dvh flex-col overflow-x-clip bg-night-950 text-cream-100">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </MotionProvider>
  );
}
