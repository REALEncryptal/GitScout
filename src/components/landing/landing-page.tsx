"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  Compass,
  GitPullRequest,
  Search,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedOrbs } from "./animated-orbs";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const steps = [
  {
    icon: Search,
    title: "Analyze",
    description:
      "We deep-dive into your GitHub history to map your languages, expertise areas, and contribution style.",
  },
  {
    icon: Compass,
    title: "Scout",
    description:
      "AI agents search thousands of active repositories to find projects that match your unique skill set.",
  },
  {
    icon: GitPullRequest,
    title: "Contribute",
    description:
      "Get curated recommendations with specific issues and a plan for making your first impact.",
  },
];

export function LandingPage() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 120], [1, 0]);

  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      <AnimatedOrbs />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10"
      >
        <div className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />
          gitscout
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 text-center">
        {/* Floating decorative shapes */}
        <FloatingShapes />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div variants={fadeUp}>
            <div className="relative mb-8 inline-flex items-center gap-2 overflow-hidden rounded-full border border-border/80 bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md">
              <Sparkles className="relative z-10 h-3.5 w-3.5 text-primary" />
              <span className="relative z-10">
                Your personal open-source talent agent
              </span>
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 dark:via-white/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: "500%" }}
                  transition={{
                    duration: 1.2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 4.5,
                  }}
                />
              )}
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
          >
            Git
            <span className="relative inline-block bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              Scout
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent bg-clip-text text-transparent"
                  initial={{ backgroundPosition: "-200% 0" }}
                  animate={{ backgroundPosition: "200% 0" }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ backgroundSize: "200% 100%" }}
                >
                  Scout
                </motion.span>
              )}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            We analyze your GitHub history to understand your unique coding
            style, scout thousands of repositories, and find active projects
            where your skills are needed most.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/40"
              >
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                <span className="absolute inset-0 -z-0 bg-gradient-to-r from-primary via-chart-2 to-primary opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-muted"
              >
                How it works
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          style={{ opacity: scrollIndicatorOpacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
          >
            <span>Scroll</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative px-6 py-32 sm:px-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-20 max-w-2xl text-center"
        >
          <div className="mb-4 inline-block rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground backdrop-blur-md">
            How it works
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            From your commits
            <br />
            <span className="bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
              to your next contribution
            </span>
          </h2>
        </motion.div>

        <div className="relative mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {/* Connector line */}
          <ConnectorLine />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-md transition-colors hover:border-primary/50"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:from-primary/10 group-hover:to-chart-2/10 group-hover:opacity-100" />

                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/80 text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 pt-16 pb-40 sm:px-10">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
          animate={
            reduce
              ? undefined
              : { scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }
          }
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Find where your
            <br />
            <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              code belongs.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Connect your GitHub and let our AI scouts do the hard work.
          </p>
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-10 inline-block"
          >
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-shadow hover:shadow-xl hover:shadow-primary/50"
            >
              <span className="relative z-10">Start scouting</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              <span className="absolute inset-0 -z-0 bg-gradient-to-r from-primary via-chart-2 to-primary opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-t border-border/60 px-6 py-8 text-center text-xs text-muted-foreground sm:px-10"
      >
        © {new Date().getFullYear()} GitScout · Built for open source
      </motion.footer>
    </div>
  );
}

type ShapeData = {
  pos: string;
  visual: string;
  anim: Record<string, number[]>;
  duration: number;
};

const SHAPES: ShapeData[] = [
  {
    pos: "left-[8%] top-[22%]",
    visual: "h-16 w-16 rounded-2xl border border-primary/40 bg-primary/5",
    anim: { y: [0, -24, 0], rotate: [0, 12, 0] },
    duration: 9,
  },
  {
    pos: "right-[10%] top-[28%]",
    visual: "h-12 w-12 rounded-full border border-chart-2/50 bg-chart-2/10",
    anim: { y: [0, 20, 0], x: [0, -10, 0] },
    duration: 11,
  },
  {
    pos: "left-[14%] bottom-[18%]",
    visual:
      "h-10 w-10 rotate-45 border border-chart-3/50 bg-chart-3/10",
    anim: { y: [0, -16, 0], rotate: [45, 90, 45] },
    duration: 10,
  },
  {
    pos: "right-[14%] bottom-[24%]",
    visual: "h-20 w-20 rounded-full border-2 border-primary/30",
    anim: { y: [0, -18, 0], scale: [1, 1.08, 1] },
    duration: 12,
  },
  {
    pos: "right-[28%] top-[14%]",
    visual: "h-6 w-6 rounded-full bg-primary/30 blur-[1px]",
    anim: { y: [0, 14, 0], x: [0, 12, 0] },
    duration: 8,
  },
];

function FloatingShapes() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {SHAPES.map((s, i) => (
        <Shape key={i} {...s} />
      ))}
    </div>
  );
}

function Shape({ pos, visual, anim, duration }: ShapeData) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 40, damping: 30, mass: 1 });
  const y = useSpring(my, { stiffness: 40, damping: 30, mass: 1 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const radius = 320;
      if (dist < radius && dist > 0) {
        const force = (1 - dist / radius) * 90;
        mx.set((-dx / dist) * force);
        my.set((-dy / dist) * force);
      } else {
        mx.set(0);
        my.set(0);
      }
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={`absolute ${pos}`}
    >
      <motion.div
        className={visual}
        animate={anim}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

function ConnectorLine() {
  const reduce = useReducedMotion();
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-0 right-0 top-16 -z-10 hidden h-2 w-full md:block"
      viewBox="0 0 100 1"
      preserveAspectRatio="none"
    >
      <motion.line
        x1="8"
        y1="0.5"
        x2="92"
        y2="0.5"
        stroke="var(--color-primary)"
        strokeWidth="0.15"
        strokeDasharray="0.6 0.6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={
          reduce
            ? { pathLength: 1, opacity: 0.5 }
            : { pathLength: 1, opacity: 0.5 }
        }
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
    </svg>
  );
}
