"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePublicSite } from "@/hooks/usePublicSite";
import { photos } from "@/components/marketing/photos";

export function Hero() {
  const reduced = useReducedMotion();
  const { site } = usePublicSite();

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
          alt="A shared meal served on a steel plate"
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
            <p className="font-display text-[clamp(2.5rem,7vw,4.75rem)] font-semibold leading-[0.95] tracking-tight text-white">
              {site.siteName || "BhuriBhoj"}
            </p>
            {site.siteNameBn ? (
              <p className="bn mt-2 text-lg font-medium text-[var(--accent)] sm:text-xl">{site.siteNameBn}</p>
            ) : null}
          </motion.div>

          <motion.h1
            className="mt-6 max-w-lg text-[1.35rem] font-semibold leading-snug text-white sm:text-2xl sm:leading-snug"
            variants={fade}
          >
            Mess and shared-kitchen management — for India and beyond.
          </motion.h1>

          <motion.p className="mt-4 max-w-md text-[0.95rem] leading-7 text-white/70" variants={fade}>
            Track meals, members, and money in one place. Built for hostels, PGs, student houses, and any kitchen that cooks together.
          </motion.p>

          <motion.div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3" variants={fade}>
            <Link href="/contact" className="m-btn m-btn-primary">
              Get started
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
