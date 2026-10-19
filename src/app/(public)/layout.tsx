import { marketingBengali, marketingSans } from "@/lib/marketingFonts";
import { MotionConfig } from "framer-motion";
import { PublicSplash } from "@/components/brand/PublicSplash";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={`${marketingSans.variable} ${marketingBengali.variable} flex min-h-dvh flex-col overflow-x-clip bg-[#090909] text-[#f6f3ec]`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#e2b657] focus:px-4 focus:py-2 focus:text-[#1a1408]"
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
