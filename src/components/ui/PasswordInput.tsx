"use client";

import { useState } from "react";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  tone?: "dark" | "light";
  toggleLabel?: string;
};

export function PasswordInput({
  className = "",
  tone = "light",
  toggleLabel = "password",
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const icon = tone === "dark" ? "text-[#e2b657]" : "text-stone-500";

  return (
    <span className="relative block">
      <input
        {...props}
        disabled={disabled}
        type={visible ? "text" : "password"}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        className={`absolute inset-y-0 right-0 flex w-12 items-center justify-center disabled:opacity-40 ${icon}`}
        aria-label={visible ? `Hide ${toggleLabel}` : `Show ${toggleLabel}`}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 5.5 19 19" />
      <path d="M9.5 9.8A3 3 0 0 0 12 15a3 3 0 0 0 2.2-.9" />
      <path d="M6.2 7.4C4.2 8.8 2.5 12 2.5 12S6 17.5 12 17.5c1.4 0 2.6-.3 3.7-.8" />
      <path d="M10 6.7A8 8 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a16 16 0 0 1-2.2 2.8" />
    </svg>
  );
}
