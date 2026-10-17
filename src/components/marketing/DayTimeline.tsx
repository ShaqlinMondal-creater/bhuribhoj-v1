"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "@/components/marketing/Reveal";

const day = [
  { time: "06:30", title: "Market duty", copy: "The manager on duty buys for the day and notes every purchase." },
  { time: "11:00", title: "Lunch is marked", copy: "Members who will eat set lunch active before the plates go out." },
  { time: "13:30", title: "Plates taken", copy: "Taken meals stay on the record. A skipped meal does not." },
  { time: "19:30", title: "Dinner, same book", copy: "Dinner is a second sitting in the same daily meal." },
  { time: "Month end", title: "The close", copy: "Deposits, spend, dues, and fines are read together before the next month opens." },
];

export function DayTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 55%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  return (
    <section className="marketing bg-[var(--surface)]">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">One day in the house</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">The order the kitchen already keeps.</h2>
        </Reveal>
        <div ref={ref} className="relative mt-12 pl-10">
          <div className="absolute bottom-0 left-3 top-0 w-px bg-white/15">
            <motion.div
              className="h-full w-full origin-top bg-[var(--accent)]"
              style={{ scaleY: reduced ? 1 : scaleY }}
            />
          </div>
          <ol className="space-y-8">
            {day.map((item) => (
              <li key={item.title} className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg)]" />
                <p className="text-sm font-semibold text-[var(--accent)]">{item.time}</p>
                <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">{item.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
