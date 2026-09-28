// Collection names shared by the server repository and the frontend cache.
// Deliberately dependency-free so it is safe to import from client code.
//
// There is no "members" collection: everyone is a record in "users", and a
// member is a user whose member_id is set.
export const COLLECTION_NAMES = [
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
  "meals",
  "guestMeals",
  "expenses",
  "users",
] as const;
