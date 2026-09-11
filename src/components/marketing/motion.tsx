"use client";

import {
  MotionConfig,
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Fragment, useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Small animation building blocks for the landing page. Everything honours
 * "reduce motion": MotionConfig turns entrance animations into plain fades,
 * and the scroll-linked effects below switch themselves off.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fades and lifts its content into place the first time it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Brings a line of text in word by word. Real spaces sit between the word
 * spans, so the line still wraps normally and reads as one sentence.
 */
export function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <motion.span
            className={cn("inline-block", className)}
            initial={{ opacity: 0, y: "0.45em", filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: EASE, delay: delay + index * 0.07 }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

/**
 * Tilts its content back in 3D and straightens it as you scroll down to it —
 * the laptop "rising" to face the reader.
 */
export function ScrollTilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 55%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [48, 0]);

  return (
    <div ref={ref} className={cn("[perspective:1600px]", className)}>
      <motion.div style={reduce ? undefined : { rotateX, scale, y, transformOrigin: "50% 0%" }}>{children}</motion.div>
    </div>
  );
}

/**
 * Counts up to `value` when it scrolls into view. The server renders the real
 * number, so search engines and no-JS readers never see a placeholder.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || reduce || started.current) return;
    if (!inView) {
      // Still below the fold: park it at zero so it can count up when reached.
      element.textContent = "0";
      return;
    }
    started.current = true;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (latest) => {
        element.textContent = Math.round(latest).toLocaleString("en-US");
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-US")}
    </span>
  );
}

/** A card whose surface lights up under the pointer. */
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const element = ref.current;
        if (!element) return;
        const box = element.getBoundingClientRect();
        element.style.setProperty("--mx", `${event.clientX - box.left}px`);
        element.style.setProperty("--my", `${event.clientY - box.top}px`);
      }}
      className={cn("group relative overflow-hidden", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(244,103,31,0.16), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
