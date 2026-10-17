"use client";

import { useEffect, useState } from "react";
import { LogoLoader } from "@/components/brand/LogoLoader";

export function BootLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = window.setTimeout(() => setVisible(false), 1100);
    return () => window.clearTimeout(hide);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#090909]">
      <LogoLoader size="md" />
    </div>
  );
}
