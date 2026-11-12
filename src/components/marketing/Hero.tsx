"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { photos } from "@/components/marketing/photos";

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="marketing relative isolate min-h-[100dvh] overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={reduced ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduced ? 0 : 1.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={photos.thali}
          alt="A steel thali with roti, sabzi, and a home mess meal"
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-[68%_40%] sm:object-[72%_38%]"
        />
      </motion.div>

      <div
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.78)_38%,rgba(0,0,0,0.35)_68%,rgba(0,0,0,0.2)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,transparent_42%)]"
        aria-hidden="true"
      />

      <div className="relative m-wrap flex min-h-[100dvh] flex-col justify-end pb-16 pt-28 sm:pb-20 md:pb-24 md:pt-32">
        <motion.div
          className="max-w-xl"
          initial={reduced ? false : "hidden"}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduced ? 0 : 0.09, delayChildren: reduced ? 0 : 0.12 } },
          }}
        >
          <motion.div variants={fade}>
            <p className="bn text-[clamp(2.75rem,8vw,5.25rem)] font-semibold leading-[0.92] tracking-tight text-[var(--accent)]">
              ভুরিভোজ
            </p>
            <p className="font-display mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-none tracking-tight text-white">
              BhuriBhoj
            </p>
          </motion.div>

          <motion.h1
            className="mt-7 max-w-md text-[1.15rem] font-medium leading-relaxed text-white/88 sm:text-xl sm:leading-relaxed"
            variants={fade}
          >
            The kitchen, the ledger, and the people. One house.
          </motion.h1>

          <motion.p className="mt-4 max-w-sm text-[0.95rem] leading-7 text-white/65" variants={fade}>
            Meals at noon and night. Money at the end of the month. A seat for every role.
          </motion.p>

          <motion.div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3" variants={fade}>
            <Link href="/contact" className="m-btn m-btn-primary">
              Start your mess
            </Link>
            <Link
              href="/features"
              className="text-sm font-semibold text-white/80 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-[var(--accent)]"
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};
