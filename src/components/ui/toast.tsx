"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Pop-up notifications in the top-right corner ("File uploaded successfully",
 * "1,096 keywords added to Pattern"). They dismiss themselves — errors stay a
 * little longer, with a bar showing the time left — and can be closed early.
 * Announced to screen readers: errors interrupt (role="alert"), everything
 * else waits its turn.
 */

type Tone = "success" | "error" | "info";

export type ToastInput = { tone: Tone; title: string; detail?: string };
type Toast = ToastInput & { id: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);

const DURATION_MS = { success: 5000, info: 5000, error: 8000 } as const;
const MAX_VISIBLE = 4;

const TONE = {
  success: { icon: "bg-emerald-500 text-white shadow-[0_0_24px_-4px_rgba(16,185,129,0.8)]", bar: "bg-emerald-400", mark: "✓" },
  error: { icon: "bg-red-500 text-white shadow-[0_0_24px_-4px_rgba(239,68,68,0.8)]", bar: "bg-red-400", mark: "!" },
  info: { icon: "bg-brand-500 text-white shadow-[0_0_24px_-4px_rgba(244,103,31,0.8)]", bar: "bg-brand-400", mark: "i" },
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
      <div className="pointer-events-none fixed top-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const tone = TONE[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className="toast-in pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-white/10 bg-night-900/95 p-3.5 pr-3 text-cream-100 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl"
            >
              <span
                aria-hidden="true"
                className={cn("grid size-7 shrink-0 place-items-center rounded-lg text-sm font-black", tone.icon)}
              >
                {tone.mark}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.detail ? (
                  <p className="mt-0.5 text-xs break-words text-cream-200/60">{toast.detail}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-mt-1 -mr-0.5 rounded-lg px-2 py-0.5 text-lg leading-none text-cream-200/45 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
              <span
                aria-hidden="true"
                className={cn("toast-timer absolute bottom-0 left-0 h-0.5 w-full opacity-70", tone.bar)}
                style={{ animationDuration: `${DURATION_MS[toast.tone]}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
