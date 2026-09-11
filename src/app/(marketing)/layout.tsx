import { MotionProvider } from "@/components/marketing/motion";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";

/**
 * Chrome for the public pages only. The tool at /app brings its own header, so
 * the marketing nav lives in this route group rather than the root layout.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </MotionProvider>
  );
}
