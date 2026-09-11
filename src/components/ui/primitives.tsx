"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The tool's building blocks, styled for its dark theme: warm near-black
 * surfaces, hairline borders and the orange accent from the site.
 */

type ButtonVariant = "primary" | "danger" | "outline" | "ghost" | "chip" | "chipActive" | "quiet";

const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_-12px_rgba(244,103,31,0.9)] hover:bg-[#ff7a36]",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
  outline: "border border-brand-500/40 bg-brand-500/10 text-brand-200 hover:bg-brand-500/20",
  ghost: "border border-white/10 bg-white/[0.04] text-cream-100 hover:border-white/15 hover:bg-white/[0.08]",
  chip: "border border-white/10 bg-white/[0.03] text-cream-200/80 hover:bg-white/[0.07] hover:text-white",
  chipActive: "border border-brand-500/50 bg-brand-500/15 text-brand-100 hover:bg-brand-500/25",
  quiet: "text-cream-200/65 hover:bg-white/[0.06] hover:text-white",
};

export function Button({
  variant = "ghost",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40",
        BUTTON_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

const FIELD =
  "rounded-xl border border-white/10 bg-white/[0.04] text-sm text-cream-100 transition-colors focus:border-brand-500/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-brand-500/15 focus:outline-none";

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={cn("w-full px-3 py-2 placeholder:text-cream-200/35", FIELD, className)} {...props} />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("bg-[length:10px] bg-[right_0.7rem_center] bg-no-repeat py-2 pr-8 pl-3", FIELD, className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath fill='%23c9b3a3' d='M6 8 0 0h12z'/%3E%3C/svg%3E\")",
      }}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 cursor-pointer rounded accent-brand-500 focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-semibold tracking-[0.12em] text-cream-200/45 uppercase", className)}>
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-sans text-[10px] font-semibold text-cream-200/60">
      {children}
    </kbd>
  );
}

/**
 * Dialog built on <dialog> so Escape, focus trapping and the backdrop come from
 * the platform rather than hand-rolled key handlers.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clicking the backdrop (the dialog element itself) dismisses.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-night-900 p-0 text-cream-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        width,
      )}
    >
      {open ? (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-white">{title}</h2>
              {description ? <p className="mt-1 text-sm text-cream-200/60">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-cream-200/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

export function Banner({
  tone,
  children,
  onDismiss,
}: {
  tone: "error" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm",
        tone === "error"
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-brand-500/25 bg-brand-500/10 text-brand-100",
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-0.5 rounded-md px-1.5 text-base leading-none opacity-70 hover:bg-white/10 hover:opacity-100"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
