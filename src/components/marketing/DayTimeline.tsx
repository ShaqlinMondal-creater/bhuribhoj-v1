"use client";

import { CalendarDays, Moon, ShoppingBasket, Sun, Utensils } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { Reveal } from "@/components/marketing/Reveal";
import { photos } from "@/components/marketing/photos";

const day = [
  { time: "06:30", title: "Market duty", copy: "The manager on duty buys for the day and notes every purchase.", icon: ShoppingBasket },
  { time: "11:00", title: "Lunch is marked", copy: "Members who will eat set lunch active before the plates go out.", icon: Sun },
  { time: "13:30", title: "Plates taken", copy: "Taken meals stay on the record. A skipped meal does not.", icon: Utensils },
  { time: "19:30", title: "Dinner, same book", copy: "Dinner is a second sitting in the same daily meal.", icon: Moon },
  { time: "Month end", title: "The close", copy: "Deposits, spend, dues, and fines are read together before the next month opens.", icon: CalendarDays },
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
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div ref={ref} className="relative pl-10">
          <div className="absolute bottom-0 left-3 top-0 w-px bg-white/15">
            <motion.div
              className="h-full w-full origin-top bg-[var(--accent)]"
              style={{ scaleY: reduced ? 1 : scaleY }}
            />
          </div>
          <ol className="space-y-8">
            {day.map((item) => {
              const Icon = item.icon;
              return (
              <li key={item.title} className="relative">
                <span className="absolute -left-10 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--bg)] text-[var(--accent)]">
                  <Icon size={12} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-[var(--accent)]">{item.time}</p>
                <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">{item.copy}</p>
              </li>
              );
            })}
          </ol>
        </div>
        <figure className="m-photo relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src={photos.rice}
            alt="Steamed rice, dal, and greens served in metal bowls"
            fill
            sizes="(max-width: 1024px) 100vw, 320px"
            placeholder="blur"
            className="object-cover"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 text-sm font-semibold text-white">
            Rice and dal
          </figcaption>
        </figure>
        </div>
      </div>
    </section>
  );
}
