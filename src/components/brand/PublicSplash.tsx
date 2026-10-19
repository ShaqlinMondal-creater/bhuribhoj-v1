"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLoader } from "@/components/brand/BrandLoader";

const key = "bb-splash";

export function PublicSplash() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"off" | "on" | "out">("off");

  useEffect(() => {
    if (pathname === "/login") return;
    if (window.sessionStorage.getItem(key) === "1") return;
    const start = window.setTimeout(() => setPhase("on"), 0);
    const hold = window.setTimeout(() => setPhase("out"), 1000);
    const done = window.setTimeout(() => {
      window.sessionStorage.setItem(key, "1");
      setPhase("off");
    }, 1400);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(hold);
      window.clearTimeout(done);
    };
  }, [pathname]);

  if (pathname === "/login" || phase === "off") return null;

  return (
    <div
      className={`marketing m-splash fixed inset-0 z-[70] grid place-items-center bg-[#090909] ${phase === "out" ? "opacity-0" : "opacity-100"}`}
    >
      <BrandLoader />
    </div>
  );
}
