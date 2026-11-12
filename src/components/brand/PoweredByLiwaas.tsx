"use client";

import Image from "next/image";
import { usePublicSite } from "@/hooks/usePublicSite";

type Tone = "light" | "dark";

export function PoweredByLiwaas({
  tone = "light",
  className = "",
}: {
  tone?: Tone;
  className?: string;
}) {
  const { site } = usePublicSite();
  const muted = tone === "dark" ? "text-[#cbbfa6]" : "text-[var(--muted)]";
  const link = tone === "dark" ? "text-[var(--accent)] hover:underline" : "text-[var(--text)] hover:underline";

  return (
    <a
      href={site.creditUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 ${muted} ${className}`}
    >
      <span>Powered by</span>
      <Image
        src="/brand/liwaas.png"
        alt={site.creditName}
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover ring-1 ring-current/20"
      />
      <span className={`font-medium ${link}`}>{site.creditName}</span>
    </a>
  );
}
