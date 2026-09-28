import "server-only";

import { DataStoreError } from "@/lib/server/storage/types";
import { getTodayDate } from "@/lib/dates";
import { makeId } from "@/lib/ids";
import type {
  CollectionMeta,
  CollectionName,
  CollectionQuery,
  ExpensesSummary,
  MealSummaryRow,
  MealsSummary,
  UsersSummary,
} from "@/data/collections";

// SERVER-SIDE LIST QUERYING.
//
// Search, filtering, paging and the lightweight dashboard totals all happen
// here, on the server, so the browser never has to download a whole collection
// just to narrow it. Every parameter is optional: a request that sends none
// behaves exactly like the old "give me the list" endpoint.
//
// This is a pure module. It never touches storage; jsonRepository reads the file
// and hands the rows over.

type Row = Record<string, unknown>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ROLES = ["admin", "manager", "president", "member"] as const;
const SUMMARIES = ["dashboard", "counts"] as const;

/** How many rows a paged request returns when it does not say. */
export const DEFAULT_PAGE_SIZE = 20;

/** The largest page a caller may ask for, which also bounds a member picker. */
export const MAX_PAGE_SIZE = 200;

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

const readText = (params: URLSearchParams, key: string): string | undefined => {
  const raw = params.get(key);
  if (raw === null) return undefined;
  const value = raw.trim();
  return value === "" ? undefined : value;
};

const readWholeNumber = (
  params: URLSearchParams,
  key: string,
  min: number,
  max: number,
): number | undefined => {
  const raw = readText(params, key);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new DataStoreError(`"${key}" must be a whole number between ${min} and ${max}.`, 400);
  }
  return value;
};

const readFlag = (params: URLSearchParams, key: string): boolean | undefined => {
  const raw = readText(params, key)?.toLowerCase();
  if (raw === undefined) return undefined;
  if (raw === "true" || raw === "1" || raw === "active") return true;
  if (raw === "false" || raw === "0" || raw === "inactive") return false;
  throw new DataStoreError(`"${key}" must be true or false.`, 400);
};

const readOneOf = <T extends string,>(
  raw: string,
  key: string,
  allowed: readonly T[],
): T => {
  const value = raw.toLowerCase() as T;
  if (!allowed.includes(value)) {
    throw new DataStoreError(`"${key}" must be one of: ${allowed.join(", ")}.`, 400);
  }
  return value;
};

/**
 * Reads the list parameters off a request url.
 *
 * Anything unrecognised is reported as a 400 rather than quietly ignored, so a
 * typo in a filter name cannot look like a filter that matched everything.
 * Parameters a given collection does not support are still accepted here and
 * dropped when the rows are filtered, which keeps one url shape for every
 * endpoint.
 */
export const parseListQuery = (params: URLSearchParams): CollectionQuery => {
  const page = readWholeNumber(params, "page", 1, 1_000_000);
  const limit = readWholeNumber(params, "limit", 1, MAX_PAGE_SIZE);
  const search = readText(params, "search");
  const role = readText(params, "role");
  const memberId = readText(params, "memberId");
  const today = readText(params, "today");
  const status = readFlag(params, "status");
  const summary = readText(params, "summary");

  if (today !== undefined && !ISO_DATE.test(today)) {
    throw new DataStoreError('"today" must be a YYYY-MM-DD date.', 400);
  }

  return {
    ...(page === undefined ? {} : { page }),
    ...(limit === undefined ? {} : { limit }),
    ...(search === undefined ? {} : { search: search.slice(0, 120) }),
    ...(role === undefined ? {} : { role: readOneOf(role, "role", ROLES) }),
    ...(status === undefined ? {} : { status }),
    ...(memberId === undefined ? {} : { memberId }),
    ...(today === undefined ? {} : { today }),
    ...(summary === undefined ? {} : { summary: readOneOf(summary, "summary", SUMMARIES) }),
  };
};

/**
 * Narrows the records a list request asked for.
 *
 * Only the fields a person would recognise are searched, so one `search` box
 * covers name, email, mobile, member id and record id without the server having
 * to guess which fields are indexable.
 */
export const filterRows = (
  collection: CollectionName,
  rows: Row[],
  query: CollectionQuery,
): Row[] => {
  if (collection === "users") return filterUsers(rows, query);
  if (collection === "meals" || collection === "guestMeals") {
    return filterByMember(rows, query);
  }
  return rows;
};

const filterUsers = (rows: Row[], query: CollectionQuery): Row[] => {
  const needle = query.search?.trim().toLowerCase() ?? "";
  return rows.filter((row) => {
    if (query.role !== undefined && row.role !== query.role) return false;
    if (query.status !== undefined && row.status !== query.status) return false;
    if (needle === "") return true;
    const haystack = [row.name, row.email, row.mobile, row.member_id, row.id]
      .map(asText)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
};

const filterByMember = (rows: Row[], query: CollectionQuery): Row[] => {
  if (query.memberId === undefined) return rows;
  return rows.filter((row) => asText(row.memberId) === query.memberId);
};

/**
 * The lightweight totals a dashboard needs, so it never downloads the records.
 *
 * `memberId` still applies, which is what lets a member see their own numbers
 * without being sent everyone else's meals.
 */
export const summarizeRows = (
  collection: CollectionName,
  rows: Row[],
  query: CollectionQuery,
): UsersSummary | MealsSummary | ExpensesSummary | { total: number } => {
  const today = query.today ?? getTodayDate();
  if (collection === "users") return summarizeUsers(rows);
  if (collection === "meals") return summarizeMeals(rows, today);
  if (collection === "expenses") return summarizeExpenses(rows);
  return { total: rows.length };
};

const summarizeUsers = (rows: Row[]): UsersSummary => ({
  total: rows.length,
  active: rows.filter((row) => row.status === true).length,
  // An entry fee is something only a member carries, so it is counted there.
  entryFeePending: rows.filter((row) => row.entryFeeStatus === "pending").length,
});

const summarizeMeals = (rows: Row[], today: string): MealsSummary => {
  const todays = rows.filter((row) => asText(row.date) === today);
  const taken = (mealType: string) =>
    todays.filter((row) => row.mealType === mealType && row.status === "taken").length;
  const recent: MealSummaryRow[] = rows.slice(-5).reverse().map((row) => ({
    id: asText(row.id),
    date: asText(row.date),
    mealType: asText(row.mealType),
    memberId: asText(row.memberId),
    status: asText(row.status),
  }));
  return {
    total: rows.length,
    todayAll: todays.length,
    todayLunch: taken("lunch"),
    todayDinner: taken("dinner"),
    recent,
  };
};

const summarizeExpenses = (rows: Row[]): ExpensesSummary => {
  const sum = (predicate: (row: Row) => boolean) =>
    rows.filter(predicate).reduce((total, row) => total + (typeof row.amount === "number" ? row.amount : 0), 0);
  return {
    total: sum(() => true),
    fixed: sum((row) => row.type === "fixed"),
    market: sum((row) => row.type === "market"),
  };
};

/**
 * The counters that travel beside a page of records.
 *
 * A page number past the end is pulled back to the last page that exists, rather
 * than answered with nothing: removing the final row of the final page would
 * otherwise leave a caller holding an empty table and no way to tell that the
 * page it asked for simply stopped existing.
 */
export const buildMeta = (
  collection: CollectionName,
  rows: Row[],
  matched: Row[],
  query: CollectionQuery,
  idPrefix: string,
): CollectionMeta => {
  const pageSize = query.limit ?? DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(matched.length / pageSize));
  const meta: CollectionMeta = {
    total: matched.length,
    page: Math.min(query.page ?? 1, totalPages),
    pageSize,
    totalPages,
    // The store holds every record, so the next id is worked out from the whole
    // collection rather than from the page the caller happens to be looking at.
    nextId: makeId(idPrefix, rows.map((row) => asText(row.id))),
  };
  if (collection === "users") meta.counts = summarizeUsers(rows);
  return meta;
};

/**
 * The counters for a response that is not a page.
 *
 * A view that asked for a whole collection still gets a total, a next id and -
 * for users - the counts, so nothing has to be requested twice to find out how
 * many records there are or what id the next one will take. The records are not
 * cut into pages because nobody asked for pages.
 */
export const buildWholeMeta = (
  collection: CollectionName,
  rows: Row[],
  matched: Row[],
  idPrefix: string,
): CollectionMeta => {
  const meta: CollectionMeta = {
    total: matched.length,
    page: 1,
    pageSize: Math.max(1, matched.length),
    totalPages: 1,
    nextId: makeId(idPrefix, rows.map((row) => asText(row.id))),
  };
  if (collection === "users") meta.counts = summarizeUsers(rows);
  return meta;
};

/** The slice of a matched list that the requested page asks for. */
export const takePage = (matched: Row[], query: CollectionQuery, page: number): Row[] => {
  const start = (page - 1) * (query.limit ?? DEFAULT_PAGE_SIZE);
  return matched.slice(start, start + (query.limit ?? DEFAULT_PAGE_SIZE));
};
