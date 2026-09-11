"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "danger" | "outline" | "ghost" | "chip" | "chipActive";

const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  outline: "border border-brand-300 bg-white text-brand-700 hover:bg-brand-50",
  ghost: "border border-cream-300 bg-white text-ink-700 hover:bg-cream-100",
  chip: "border border-cream-300 bg-white text-ink-700 hover:bg-cream-100",
  chipActive: "border border-brand-500 bg-brand-500 text-white hover:bg-brand-600",
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
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-cream-200 bg-white/80 p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-ink-900",
        "placeholder:text-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "rounded-xl border border-cream-300 bg-white bg-[length:14px] bg-[right_0.6rem_center] bg-no-repeat py-2 pr-8 pl-3 text-sm text-ink-900",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath fill='%238a7263' d='M6 8 0 0h12z'/%3E%3C/svg%3E\")",
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
        "size-4 cursor-pointer rounded border-cream-300 text-brand-500 accent-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500",
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-bold tracking-wide text-ink-500 uppercase", className)}>
      {children}
    </span>
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
        "m-auto w-[calc(100vw-2rem)] rounded-2xl border border-cream-200 bg-cream-50 p-0 shadow-2xl backdrop:bg-ink-900/30",
        width,
      )}
    >
      {open ? (
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink-900">{title}</h2>
              {description ? <p className="mt-1 text-sm text-ink-700">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1 text-ink-500 hover:bg-cream-200 hover:text-ink-900"
            >
              <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
                <path
                  d="M6 6l8 8M14 6l-8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

export function Banner({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-brand-100 bg-brand-50 text-brand-700",
      )}
    >
      {children}
    </div>
  );
}
