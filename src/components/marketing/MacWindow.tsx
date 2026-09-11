import Image, { type StaticImageData } from "next/image";
import type { SVGProps } from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * A macOS browser window drawn in CSS around a real screenshot — traffic
 * lights, one tab and an address bar, the way a Cmd+Shift+4 window capture
 * looks. CSS rather than a baked PNG: it stays sharp at every width, costs no
 * extra download, and the screenshot inside is an ordinary next/image with
 * real alt text.
 */

const ADDRESS = `${new URL(siteConfig.url).host}${siteConfig.appPath}`;

const Glyph = ({ children, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export function MacWindow({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1280px) 1150px, 94vw",
  compact = false,
  className,
}: {
  src: StaticImageData;
  alt: string;
  priority?: boolean;
  sizes?: string;
  /** Tighter chrome for windows shown at a few hundred pixels wide. */
  compact?: boolean;
  className?: string;
}) {
  const icon = compact ? "size-2.5" : "size-3 sm:size-3.5";

  return (
    <figure
      className={cn(
        "relative mx-auto w-full overflow-hidden rounded-[10px] bg-[#1e1f22] ring-1 ring-black/40",
        "shadow-[0_50px_100px_-25px_rgba(0,0,0,0.5),0_30px_60px_-30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      {/* Tab strip */}
      <div aria-hidden="true" className={cn("flex items-end", compact ? "gap-2 px-2.5 pt-1.5" : "gap-3 px-3 pt-2 sm:px-4 sm:pt-2.5")}>
        <div className={cn("flex self-center", compact ? "gap-1 pb-1" : "gap-1.5 pb-1.5 sm:gap-2")}>
          {["bg-[#ff5f57]", "bg-[#febc2e]", "bg-[#28c840]"].map((color) => (
            <span key={color} className={cn("rounded-full ring-1 ring-black/25", color, compact ? "size-2" : "size-2.5 sm:size-3")} />
          ))}
        </div>
        <div
          className={cn(
            "flex min-w-0 items-center rounded-t-lg bg-[#35363a] text-white/85",
            compact ? "w-32 gap-1.5 px-2 py-1 text-[9px]" : "w-40 gap-2 px-3 py-1.5 text-[10px] sm:w-56 sm:text-xs",
          )}
        >
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-[3px] bg-brand-500 font-black text-white",
              compact ? "size-2.5 text-[6px]" : "size-3 text-[7px] sm:size-3.5 sm:text-[8px]",
            )}
          >
            N
          </span>
          <span className="truncate">{siteConfig.name} — keyword desk</span>
          <Glyph className={cn("ml-auto shrink-0 text-white/50", icon)}>
            <path d="M18 6 6 18M6 6l12 12" />
          </Glyph>
        </div>
        <Glyph className={cn("self-center text-white/50", compact ? "mb-1 size-2.5" : "mb-1.5 size-3 sm:size-3.5")}>
          <path d="M12 5v14M5 12h14" />
        </Glyph>
      </div>

      {/* Toolbar */}
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center bg-[#35363a] text-white/60",
          compact ? "gap-2 px-2.5 py-1" : "gap-3 px-3 py-1.5 sm:gap-4 sm:px-4 sm:py-2",
        )}
      >
        <Glyph className={icon}>
          <path d="M19 12H5M11 5l-7 7 7 7" />
        </Glyph>
        <Glyph className={cn(icon, "opacity-50")}>
          <path d="M5 12h14M13 5l7 7-7 7" />
        </Glyph>
        <Glyph className={icon}>
          <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
        </Glyph>
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center rounded-full bg-[#202124] text-white/80",
            compact ? "gap-1.5 px-2 py-0.5 text-[9px]" : "gap-2 px-3 py-1 text-[10px] sm:text-xs",
          )}
        >
          <Glyph className={cn("shrink-0 text-white/50", compact ? "size-2" : "size-2.5 sm:size-3")}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </Glyph>
          <span className="truncate">{ADDRESS}</span>
          <Glyph className={cn("ml-auto shrink-0 text-white/50", icon)}>
            <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" />
          </Glyph>
        </div>
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-brand-500 font-bold text-white",
            compact ? "size-3.5 text-[7px]" : "size-4 text-[8px] sm:size-5 sm:text-[10px]",
          )}
        >
          S
        </span>
      </div>

      <Image
        src={src}
        alt={alt}
        // Next 16 spells "priority" as preload; only the hero sets it (LCP image).
        preload={priority}
        fetchPriority={priority ? "high" : undefined}
        placeholder="blur"
        sizes={sizes}
        className="block h-auto w-full"
      />
    </figure>
  );
}
