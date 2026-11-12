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
  size?: "md" | "lg" | "xl";
  backdrop?: "black" | "stone";
  closeClassName?: string;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const width = size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${backdrop === "stone" ? "bg-stone-950/40" : "bg-black/40"}`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl ${width}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
          <button type="button" onClick={onClose} className={closeClassName} aria-label="Close">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
