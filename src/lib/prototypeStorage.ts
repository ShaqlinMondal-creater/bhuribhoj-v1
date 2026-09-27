import membersSeed from "@/data/json/members.json";
import mealsSeed from "@/data/json/meals.json";
import guestMealsSeed from "@/data/json/guestMeals.json";
import expensesSeed from "@/data/json/expenses.json";
import messSeed from "@/data/json/mess.json";
import settingsSeed from "@/data/json/settings.json";

export const STORAGE_KEYS = {
  members: "bhuribhoj.members",
  meals: "bhuribhoj.meals",
  guestMeals: "bhuribhoj.guestMeals",
  expenses: "bhuribhoj.expenses",
  mess: "bhuribhoj.mess",
  settings: "bhuribhoj.settings",
} as const;

export const seedCollections = {
  [STORAGE_KEYS.members]: membersSeed,
  [STORAGE_KEYS.meals]: mealsSeed,
  [STORAGE_KEYS.guestMeals]: guestMealsSeed,
  [STORAGE_KEYS.expenses]: expensesSeed,
  [STORAGE_KEYS.mess]: messSeed,
  [STORAGE_KEYS.settings]: settingsSeed,
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
let dataVersion = 0;
const dataListeners = new Set<() => void>();

export const subscribeToPrototypeData = (listener: () => void) => {
  dataListeners.add(listener);
  return () => dataListeners.delete(listener);
};

export const getPrototypeDataVersion = () => dataVersion;

const notifyDataChange = () => {
  dataVersion += 1;
  dataListeners.forEach((listener) => listener());
};

export function readCollection<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return clone(seed);
  const stored = window.localStorage.getItem(key);
  if (!stored) {
    const initial = clone(seed);
    window.localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    const initial = clone(seed);
    window.localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
}

export function writeCollection<T>(key: string, value: T): T {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("bhuribhoj:data-changed", { detail: key }));
  }
  notifyDataChange();
  return value;
}

export function resetPrototypeData() {
  if (typeof window === "undefined") return;
  Object.keys(STORAGE_KEYS).forEach((name) => {
    const key = STORAGE_KEYS[name as keyof typeof STORAGE_KEYS];
    window.localStorage.removeItem(key);
  });
  window.dispatchEvent(new CustomEvent("bhuribhoj:data-reset"));
  notifyDataChange();
}

export const nowIso = () => new Date().toISOString();

export const makeId = (prefix: string, ids: string[]) => {
  const next = ids.reduce((highest, id) => {
    const number = Number(id.replace(prefix, ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};