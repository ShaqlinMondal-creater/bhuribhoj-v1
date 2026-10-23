export const THEME_KEY = "bhuribhoj-theme";

export const themes = [
  { id: "black-yellow", name: "Black yellow", note: "Ink canvas, gold type and buttons." },
  { id: "sea-green", name: "Sea green", note: "Deep green house, white type on the buttons." },
  { id: "orange", name: "Orange", note: "Burnt orange on a dark hearth." },
  { id: "red", name: "Red", note: "Deep red, kept for the whole house." },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

const ids = new Set<string>(themes.map((theme) => theme.id));

export function isThemeId(value: string | null): value is ThemeId {
  return value != null && ids.has(value);
}

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  localStorage.setItem(THEME_KEY, id);
}

export function readTheme(): ThemeId {
  if (typeof document === "undefined") return "black-yellow";
  const current = document.documentElement.dataset.theme ?? null;
  return isThemeId(current) ? current : "black-yellow";
}
