import Image, { type StaticImageData } from "next/image";

import { cn } from "@/lib/utils";

/**
 * A MacBook drawn in CSS around a real screenshot.
 *
 * CSS rather than a PNG mockup: it stays sharp at every width, costs no extra
 * download, and the screenshot inside is an ordinary optimised next/image with
 * real alt text — so search engines index the picture, not a decorative frame.
 * Proportions follow a 14" MacBook Pro: 16:10 panel, thin bezel, notch, and a
 * base slightly wider than the lid.
 */
export function MacbookFrame({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1280px) 1100px, 92vw",
  className,
}: {
  src: StaticImageData;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <figure className={cn("relative mx-auto w-full", className)}>
      {/* Lid */}
      <div className="relative rounded-[3.2%/5%] bg-gradient-to-b from-[#2a2a2e] to-[#101012] p-[1.4%] shadow-[0_40px_80px_-20px_rgba(36,23,15,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
        {/* Camera notch */}
        <div
          aria-hidden="true"
          className="absolute top-[1.4%] left-1/2 z-10 h-[2.6%] w-[11%] -translate-x-1/2 rounded-b-[40%] bg-[#101012]"
        >
          <span className="absolute top-[35%] left-1/2 size-[18%] min-h-1 min-w-1 -translate-x-1/2 rounded-full bg-[#2b3440]" />
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.6%/1%] bg-black">
          <Image
            src={src}
            alt={alt}
            // Next 16 spells "priority" as preload (a <link rel=preload> plus eager
            // loading); fetchPriority also puts it first in the browser's queue.
            // Only the hero sets this — it is the page's LCP element.
            preload={priority}
            fetchPriority={priority ? "high" : undefined}
            placeholder="blur"
            sizes={sizes}
            className="h-full w-full object-cover object-top"
          />
          {/* Glass sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent"
          />
        </div>
      </div>

      {/* Base */}
      <div
        aria-hidden="true"
        className="relative -mx-[6.5%] h-[clamp(8px,1.6vw,18px)] rounded-b-[45%/100%] bg-gradient-to-b from-[#e8e6e3] via-[#cfccc8] to-[#8f8b86] shadow-[0_18px_30px_-12px_rgba(36,23,15,0.5)]"
      >
        <div className="absolute top-0 left-1/2 h-[45%] w-[15%] -translate-x-1/2 rounded-b-[50%] bg-gradient-to-b from-[#b7b3ae] to-[#d6d3cf]" />
      </div>
    </figure>
  );
}

/** A floating product crop — a screenshot of one panel, lifted off the page. */
export function FloatingShot({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 420px, 80vw",
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-15px_rgba(36,23,15,0.35)] ring-1 ring-ink-900/10",
        className,
      )}
    >
      <Image src={src} alt={alt} placeholder="blur" sizes={sizes} className="h-auto w-full" />
    </div>
  );
}
