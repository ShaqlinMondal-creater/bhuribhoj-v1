const OPEN = "bb-today-menu-open";
const SAVED = "bb-today-menu-saved";

export function openTodayMenuDialog() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN));
}

export function notifyTodayMenuSaved() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SAVED));
}

export function onTodayMenuOpen(handler: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(OPEN, handler);
  return () => window.removeEventListener(OPEN, handler);
}

export function onTodayMenuSaved(handler: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(SAVED, handler);
  return () => window.removeEventListener(SAVED, handler);
}
