"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Pop-up notifications in the top-right corner ("File uploaded successfully",
 * "1,096 keywords added to Pattern"). They dismiss themselves — errors stay a
 * little longer — and can be closed early. Announced to screen readers:
 * errors interrupt (role="alert"), everything else waits its turn.
 */

type Tone = "success" | "error" | "info";

export type ToastInput = { tone: Tone; title: string; detail?: string };
type Toast = ToastInput & { id: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);

const DURATION_MS = { success: 5000, info: 5000, error: 8000 } as const;
const MAX_VISIBLE = 4;

const TONE = {
  success: { bar: "border-l-emerald-500", icon: "bg-emerald-600 text-white", mark: "✓" },
  error: { bar: "border-l-red-500", icon: "bg-red-600 text-white", mark: "!" },
  info: { bar: "border-l-brand-500", icon: "bg-brand-500 text-white", mark: "i" },
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { ...input, id }]);
      window.setTimeout(() => dismiss(id), DURATION_MS[input.tone]);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const tone = TONE[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className={cn(
                "toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-l-4 border-cream-200 bg-white p-3.5 shadow-[0_18px_40px_-16px_rgba(36,23,15,0.35)]",
                tone.bar,
              )}
            >
              <span
                aria-hidden="true"
                className={cn("grid size-7 shrink-0 place-items-center rounded-lg text-sm font-black", tone.icon)}
              >
                {tone.mark}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-900">{toast.title}</p>
                {toast.detail ? <p className="mt-0.5 text-xs break-words text-ink-700">{toast.detail}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-mt-1 -mr-1 rounded-full px-2 py-0.5 text-lg leading-none text-ink-500 hover:bg-cream-100 hover:text-ink-900"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
