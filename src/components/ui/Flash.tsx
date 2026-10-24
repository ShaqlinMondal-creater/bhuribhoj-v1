"use client";

import { useEffect, useState } from "react";

export function Flash({ message }: { message: string | null }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(message);
    if (!message) return;
    const timer = window.setTimeout(() => setText(null), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!text) return null;

  return (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-[var(--accent)]/40 bg-white px-4 py-2.5 text-sm font-medium text-stone-950 shadow-lg shadow-stone-900/10"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
        <span>{text}</span>
        <button type="button" onClick={() => setText(null)} className="text-stone-400 hover:text-stone-700" aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}
