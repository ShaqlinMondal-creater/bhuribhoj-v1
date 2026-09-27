// Collection names shared by the server repository and the frontend cache.
// Deliberately dependency-free so it is safe to import from client code.
export const COLLECTION_NAMES = [
  "members",
  "meals",
  "guestMeals",
  "expenses",
  "mess",
  "settings",
  "users",
] as const;

export type CollectionName = (typeof COLLECTION_NAMES)[number];

export const isCollectionName = (value: string): value is CollectionName =>
  (COLLECTION_NAMES as readonly string[]).includes(value);

/** Collections that hold a list of records rather than a single document. */
export const LIST_COLLECTIONS = [
  "members",
  "meals",
  "guestMeals",
  "expenses",
  "users",
] as const;
