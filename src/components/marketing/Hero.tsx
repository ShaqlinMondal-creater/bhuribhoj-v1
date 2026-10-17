"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setValue(to);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700);
      setValue(Math.round(to * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, to]);

  return <span ref={ref}>{value}</span>;
}

const bars = [40, 55, 48, 70, 62, 80, 58];

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="marketing relative overflow-hidden">
      <div className="m-wrap grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2">
        <motion.div
          initial={reduced ? false : "hidden"}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduced ? 0 : 0.08 } },
          }}
        >
          <motion.p
            className="text-sm font-medium text-[var(--accent)]"
            variants={fade}
          >
            <span className="bn">ভুরিভোজ</span>
            <span className="text-[var(--muted)]"> · the mess house</span>
          </motion.p>
          <motion.h1
            className="mt-4 max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            variants={fade}
          >
            The kitchen, the ledger, and the people. One house.
          </motion.h1>
          <motion.p className="mt-5 max-w-md text-base leading-7 text-[var(--muted)]" variants={fade}>
            Meals at noon and night. Money at the end of the month. A seat for every role.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" variants={fade}>
            <Link href="/contact" className="m-btn m-btn-primary">
              Start your mess
            </Link>
            <Link href="/features" className="m-btn m-btn-ghost">
              See how it works
            </Link>
          </motion.div>
        </motion.div>

        <div className="relative">
          <div className="m-glow pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(226,182,87,0.35),transparent_68%)]" />
          <motion.div
            className={reduced ? "relative" : "m-float relative"}
            initial={reduced ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          >
            <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Today · sample house</p>
                <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--muted)]">Example</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[12px] bg-[var(--surface-2)] p-4">
                  <p className="text-xs text-[var(--muted)]">Lunch marked</p>
                  <p className="mt-2 text-3xl font-semibold">
                    <CountUp to={18} />
                  </p>
                </div>
                <div className="rounded-[12px] bg-[var(--surface-2)] p-4">
                  <p className="text-xs text-[var(--muted)]">Dinner marked</p>
                  <p className="mt-2 text-3xl font-semibold">
                    <CountUp to={16} />
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-[12px] border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">Pending dues · sample</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--accent)]">₹4,200</p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-[var(--muted)]">Meals this week</p>
                <div className="mt-3 flex h-20 items-end gap-2" aria-hidden="true">
                  {bars.map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-md bg-[var(--accent)]"
                      style={{ height: `${height}%`, opacity: 0.45 + index * 0.07 }}
                    />
                  ))}
                </div>
              </div>
            </article>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};
