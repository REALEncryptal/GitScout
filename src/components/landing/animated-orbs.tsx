"use client";

import { motion, useReducedMotion } from "motion/react";

export function AnimatedOrbs() {
  const reduce = useReducedMotion();

  const float = (
    x: number[],
    y: number[],
    s: number[],
    duration: number,
  ) =>
    reduce
      ? undefined
      : {
          x,
          y,
          scale: s,
          transition: {
            duration,
            repeat: Infinity,
            repeatType: "mirror" as const,
            ease: "easeInOut" as const,
          },
        };

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Soft dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "28px 28px",
          color: "var(--muted-foreground)",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Orb 1 — primary, top-left */}
      <motion.div
        className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-primary/30 blur-3xl dark:bg-primary/25"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={float([0, 80, -20], [0, 60, -40], [1, 1.15, 0.95], 22)}
      />

      {/* Orb 2 — accent, bottom-right */}
      <motion.div
        className="absolute -bottom-48 -right-32 h-[40rem] w-[40rem] rounded-full bg-accent/60 blur-3xl dark:bg-accent/30"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={float([0, -60, 30], [0, -40, 20], [1, 1.1, 0.9], 26)}
      />

      {/* Orb 3 — chart-2, mid */}
      <motion.div
        className="absolute top-1/3 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-chart-2/25 blur-3xl dark:bg-chart-2/20"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={float([0, -40, 50], [0, 50, -30], [1, 0.9, 1.1], 18)}
      />

      {/* Orb 4 — small, top-right */}
      <motion.div
        className="absolute top-20 right-1/4 h-[18rem] w-[18rem] rounded-full bg-chart-3/25 blur-3xl dark:bg-chart-3/20"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={float([0, 30, -20], [0, -20, 30], [1, 1.05, 0.95], 16)}
      />
    </div>
  );
}
