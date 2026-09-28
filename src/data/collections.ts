// Collection names and list-query shapes shared by the server repository, the
// API routes and the frontend cache. Deliberately dependency-free so it is safe
// to import from client code.
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

export type ListCollectionName = (typeof LIST_COLLECTIONS)[number];

/**
 * How a list request is narrowed and sliced.
 *
 * Every parameter is optional and the server ignores the ones a collection does
 * not understand, so the same shape works for every endpoint and a request that
 * asks for nothing keeps the plain "give me the list" behaviour.
 */
export type CollectionQuery = {
  /** Free text, matched against the fields a record would be recognised by. */
  search?: string;
  /** users: admin | manager | president | member. */
  role?: string;
  /** users: true = active, false = inactive. */
  status?: boolean;
  /** meals / guestMeals: restrict to the member who booked the record. */
  memberId?: string;
  /** The browser's idea of today, so a summary counts the same day on both sides. */
  today?: string;
  /** 1-based page number. */
  page?: number;
  /** Rows per page. */
  limit?: number;
  /** Return lightweight totals instead of records. */
  summary?: "dashboard" | "counts";
};

/** Totals over the whole users collection, ignoring any search or filter. */
export type UsersSummary = {
  total: number;
  active: number;
  entryFeePending: number;
};

export type MealSummaryRow = {
  id: string;
  date: string;
  mealType: string;
  memberId: string;
  status: string;
};

/** Everything the dashboard shows about meals, in one small response. */
export type MealsSummary = {
  total: number;
  todayAll: number;
  todayLunch: number;
  todayDinner: number;
  recent: MealSummaryRow[];
};

export type GuestMealsSummary = { total: number };

export type ExpensesSummary = { total: number; fixed: number; market: number };

/** Paging and counters that come back beside a list of records. */
export type CollectionMeta = {
  /** How many records matched the search and filters. */
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** The id the next created record should use. */
  nextId: string;
  /** users only: totals over the whole collection. */
  counts?: UsersSummary;
};
