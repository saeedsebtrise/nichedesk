import type { ReactNode } from "react";

import { readableText } from "@/features/settings/colors";
import { cn } from "@/lib/utils";

/** A number on the colour its band was given in Colour rules, with text that stays readable on it. */
export function ColorBadge({
  color,
  children,
  size = "md",
  title,
}: {
  color: string;
  children: ReactNode;
  size?: "sm" | "md";
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "tabular inline-block rounded-md font-bold",
        size === "sm" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-xs",
      )}
      style={{ backgroundColor: color, color: readableText(color) }}
    >
      {children}
    </span>
  );
}
