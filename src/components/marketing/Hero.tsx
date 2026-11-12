"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { photos } from "@/components/marketing/photos";

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="marketing relative isolate min-h-[min(100dvh,44rem)] overflow-hidden md:min-h-[min(100dvh,52rem)]">
      <motion.div
        className="absolute inset-0"
        initial={reduced ? false : { scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduced ? 0 : 1.4, ease: "easeOut" }}
      >
        <Image
          src={photos.thali}
          alt="A steel thali with roti, sabzi, and a home mess meal"
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-[center_35%]"
        />
      </motion.div>
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/72 to-black/45"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" aria-hidden="true" />

      <div className="relative m-wrap flex min-h-[min(100dvh,44rem)] flex-col justify-end pb-14 pt-28 md:min-h-[min(100dvh,52rem)] md:pb-20 md:pt-32">
        <motion.div
          className="max-w-2xl"
          initial={reduced ? false : "hidden"}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduced ? 0 : 0.1 } },
          }}
        >
          <motion.p
            className="bn text-5xl font-semibold leading-none tracking-tight text-[var(--accent)] sm:text-6xl md:text-7xl"
            variants={fade}
          >
            ভুরিভোজ
          </motion.p>
          <motion.p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl" variants={fade}>
            BhuriBhoj
          </motion.p>
          <motion.h1
            className="mt-5 max-w-xl text-xl font-medium leading-snug text-[#f6f3ec]/90 sm:text-2xl"
            variants={fade}
          >
            The kitchen, the ledger, and the people. One house.
          </motion.h1>
          <motion.p className="mt-4 max-w-md text-base leading-7 text-[#f6f3ec]/72" variants={fade}>
            Meals at noon and night. Money at the end of the month. A seat for every role.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" variants={fade}>
            <Link href="/contact" className="m-btn m-btn-primary">
              Start your mess
            </Link>
            <Link href="/features" className="m-btn m-btn-ghost border-white/25 text-white hover:border-[var(--accent)]">
              See how it works
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
