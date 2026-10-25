import type { ReactNode } from "react";

export type IconName =
  | "grid"
  | "users"
  | "meals"
  | "wallet"
  | "building"
  | "plans"
  | "logout"
  | "shield"
  | "mark"
  | "pencil"
  | "mail"
  | "panel"
  | "menu"
  | "receipt"
  | "card"
  | "ticket"
  | "calendar"
  | "gear"
  | "sliders"
  | "logs"
  | "eye"
  | "trash"
  | "copy"
  | "market";

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
  plans: (
    <>
      <rect x="4" y="4.5" width="16" height="15" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
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
  pencil: (
    <>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m13.5 6.5 3 3" />
    </>
  ),
  mark: (
    <>
      <path d="M12 3.5c2.8 2.2 4.5 4.6 4.5 7.4a4.5 4.5 0 0 1-9 0C7.5 8.1 9.2 5.7 12 3.5Z" />
      <path d="M8 14.5c-2.2 1-3.5 2.4-3.5 4 0 1.8 3.2 3 7.5 3s7.5-1.2 7.5-3c0-1.6-1.3-3-3.5-4" />
    </>
  ),
  panel: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  receipt: (
    <>
      <path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5V20l-2.2-1.4L14 20l-2-1.4L10 20l-2.2-1.4L5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </>
  ),
  card: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10h17" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v2a2 2 0 0 0 0 4v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2 2 0 0 0 0-4v-2Z" />
      <path d="M12 7.5v9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.8v2M12 18.2v2M4.9 6.5l1.5 1.5M17.6 16l1.5 1.5M3.8 12h2M18.2 12h2M4.9 17.5l1.5-1.5M17.6 8l1.5-1.5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 8h16" />
      <path d="M4 16h16" />
      <circle cx="9" cy="8" r="2.2" />
      <circle cx="15" cy="16" r="2.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6.5 6.5 12 6.5 21.5 12 21.5 12 17.5 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="1.5" />
      <path d="M16 8V6.5A1.5 1.5 0 0 0 14.5 5h-8A1.5 1.5 0 0 0 5 6.5v8A1.5 1.5 0 0 0 6.5 16H8" />
    </>
  ),
  market: (
    <>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6.5A3 3 0 0 1 12 3.5 3 3 0 0 1 15 6.5V8" />
    </>
  ),
  logs: (
    <>
      <path d="M8 4.5h10A1.5 1.5 0 0 1 19.5 6v13.5H8A1.5 1.5 0 0 1 6.5 18V6A1.5 1.5 0 0 1 8 4.5Z" />
      <path d="M10 9.5h6" />
      <path d="M10 13h6" />
      <path d="M10 16.5h4" />
    </>
  ),
};
