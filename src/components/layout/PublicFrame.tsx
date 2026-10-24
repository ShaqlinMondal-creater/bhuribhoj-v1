"use client";

import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { PublicSplash } from "@/components/brand/PublicSplash";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

export function PublicFrame({
  fontClassName,
  children,
}: {
  fontClassName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const panel = pathname.startsWith("/admin") || pathname.startsWith("/mess");
  if (panel) return children;

  return (
    <MotionConfig reducedMotion="user">
      <div className={`${fontClassName} flex min-h-dvh flex-col overflow-x-clip bg-[var(--site)] text-[#f6f3ec]`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-[var(--accent-ink)]"
        >
          Skip to content
        </a>
        <PublicHeader />
        <PublicSplash />
        <div id="content" className="flex-1">
          {children}
        </div>
        <PublicFooter />
      </div>
    </MotionConfig>
  );
}
