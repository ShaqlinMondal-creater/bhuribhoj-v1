import "server-only";

import { COLLECTIONS, type CollectionName } from "@/lib/server/collections";

import expensesSeed from "@/data/initial/expenses.json";
import guestMealsSeed from "@/data/initial/guestMeals.json";
import mealsSeed from "@/data/initial/meals.json";
import messSeed from "@/data/initial/mess.json";
import settingsSeed from "@/data/initial/settings.json";
import usersSeed from "@/data/initial/users.json";

// IMMUTABLE INITIAL SEED.
//
// src/data/initial is never written to; it is the state every reset returns to.
// The files are imported statically rather than read from disk at runtime so the
// seed is always available, including on Vercel, where the working tree is not
// a dependable source of files.
//
// users.json is the whole population: there is no members.json, because a
// member is just a user with a member_id.
//
// These imports are server-only. Nothing here may reach a client bundle.

const SEEDS: Record<CollectionName, unknown> = {
  meals: mealsSeed,
  guestMeals: guestMealsSeed,
  expenses: expensesSeed,
  mess: messSeed,
  settings: settingsSeed,
  users: usersSeed,
};

/** The label used when a parse failure has to name a seed file. */
export const initialFileLabel = (name: CollectionName) => `initial/${COLLECTIONS[name].file}`;

/**
 * The seed serialised the way the live files are written.
 *
 * This is the fallback for runtimes where the seed file is not on disk. The
 * local repository prefers the file itself, because the committed seeds are
 * hand-formatted and re-serialising them would show up as a diff.
 */
export const initialText = (name: CollectionName) => `${JSON.stringify(SEEDS[name], null, 2)}\n`;

export const initialValue = <T,>(name: CollectionName): T => SEEDS[name] as T;
