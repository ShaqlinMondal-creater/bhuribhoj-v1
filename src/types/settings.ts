export type GuestThaliType =
  | "fish-thali"
  | "chicken-thali"
  | "veg-thali"
  | "egg-thali";

export type Settings = {
  guestThaliPrices: Record<GuestThaliType, number>;
  fixedExpenseCategories: string[];
  marketExpenseCategories: string[];
};