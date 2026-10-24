"use client";

import { useEffect } from "react";

export function Dialog({
  title,
  onClose,
  children,
  size = "md",
  backdrop = "black",
  closeClassName = "text-sm text-stone-500",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
  backdrop?: "black" | "stone";
  closeClassName?: string;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${backdrop === "stone" ? "bg-stone-950/40" : "bg-black/40"}`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full rounded-2xl bg-white p-5 shadow-xl ${size === "lg" ? "max-w-lg" : "max-w-md"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
          <button type="button" onClick={onClose} className={closeClassName} aria-label="Close">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
