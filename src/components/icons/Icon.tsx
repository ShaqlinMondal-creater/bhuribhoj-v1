import type { ReactNode } from "react";

export type IconName =
  | "grid"
  | "users"
  | "meals"
  | "wallet"
  | "building"
  | "mail"
  | "logout"
  | "shield"
  | "mark";

export function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {glyphs[name]}
    </svg>
  );
}

const glyphs: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.2a3.2 3.2 0 0 0-3.2-3.2H7.2A3.2 3.2 0 0 0 4 18.8V20" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 20v-1.2a3.2 3.2 0 0 0-2.4-3.1" />
      <path d="M16 5.1a3 3 0 0 1 0 5.8" />
    </>
  ),
  meals: (
    <>
      <path d="M6 3.5v7" />
      <path d="M9 3.5v7" />
      <path d="M6 7h3" />
      <path d="M7.5 10.5V20" />
      <path d="M16.5 3.5c-1.4 1.6-2 3.2-2 5.2 0 1.8 1 2.8 2 2.8s2-1 2-2.8c0-2-0.6-3.6-2-5.2Z" />
      <path d="M16.5 11.5V20" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6.5" width="17" height="12" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M16 14.5h2" />
    </>
  ),
  building: (
    <>
      <path d="M4.5 20.5h15" />
      <path d="M6.5 20.5V5.5A1.5 1.5 0 0 1 8 4h8a1.5 1.5 0 0 1 1.5 1.5v15" />
      <path d="M10 8.5h1.5" />
      <path d="M13.5 8.5H15" />
      <path d="M10 12h1.5" />
      <path d="M13.5 12H15" />
      <path d="M11 20.5v-3.5h2v3.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  logout: (
    <>
      <path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17" />
      <path d="M4 12h10" />
      <path d="m11 9 3 3-3 3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6.2v5.3c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.2L12 3.5Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  mark: (
    <>
      <path d="M12 3.5c2.8 2.2 4.5 4.6 4.5 7.4a4.5 4.5 0 0 1-9 0C7.5 8.1 9.2 5.7 12 3.5Z" />
      <path d="M8 14.5c-2.2 1-3.5 2.4-3.5 4 0 1.8 3.2 3 7.5 3s7.5-1.2 7.5-3c0-1.6-1.3-3-3.5-4" />
    </>
  ),
};
